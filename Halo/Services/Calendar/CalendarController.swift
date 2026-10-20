import EventKit
import Foundation

/// Upcoming events and open reminders from the user's calendars, via EventKit.
@MainActor @Observable
final class CalendarController {
    enum Access: Equatable { case notDetermined, denied, authorized }

    struct Event: Identifiable, Equatable {
        let id: String
        let title: String
        let start: Date
        let end: Date
        let isAllDay: Bool
        let calendarColor: CGColor?
    }

    struct Reminder: Identifiable, Equatable, Sendable {
        let id: String
        let title: String
        let due: Date?
    }

    private(set) var eventAccess: Access = .notDetermined
    private(set) var reminderAccess: Access = .notDetermined
    private(set) var events: [Event] = []
    private(set) var reminders: [Reminder] = []
    private(set) var lastError: String?

    @ObservationIgnored private let store = EKEventStore()
    @ObservationIgnored private var observer: NSObjectProtocol?

    init() {
        eventAccess = Self.map(EKEventStore.authorizationStatus(for: .event))
        reminderAccess = Self.map(EKEventStore.authorizationStatus(for: .reminder))
        observer = NotificationCenter.default.addObserver(forName: .EKEventStoreChanged, object: store, queue: .main) { [weak self] _ in
            Task { @MainActor [weak self] in await self?.refresh() }
        }
    }

    func requestEventAccess() async {
        let granted = (try? await store.requestFullAccessToEvents()) ?? false
        eventAccess = granted ? .authorized : .denied
        await refresh()
    }

    func requestReminderAccess() async {
        let granted = (try? await store.requestFullAccessToReminders()) ?? false
        reminderAccess = granted ? .authorized : .denied
        await refresh()
    }

    func refresh(now: Date = .now) async {
        if eventAccess == .authorized {
            let end = Calendar.current.date(byAdding: .day, value: 7, to: now)!
            let predicate = store.predicateForEvents(withStart: now, end: end, calendars: nil)
            events = store.events(matching: predicate)
                .sorted { $0.startDate < $1.startDate }
                .prefix(8)
                .map { Event(id: $0.eventIdentifier ?? UUID().uuidString, title: $0.title ?? "Untitled", start: $0.startDate, end: $0.endDate, isAllDay: $0.isAllDay, calendarColor: $0.calendar?.cgColor) }
        }
        if reminderAccess == .authorized {
            let predicate = store.predicateForIncompleteReminders(withDueDateStarting: nil, ending: nil, calendars: nil)
            // EventKit calls back on a background queue: the closure must be
            // @Sendable (not main-actor) and convert to value types right away.
            let fetched: [Reminder] = await withCheckedContinuation { continuation in
                store.fetchReminders(matching: predicate) { @Sendable results in
                    continuation.resume(returning: (results ?? []).map { reminder in
                        Reminder(id: reminder.calendarItemIdentifier, title: reminder.title ?? "Untitled", due: reminder.dueDateComponents?.date)
                    })
                }
            }
            reminders = Self.sortReminders(fetched)
        }
    }

    func complete(_ id: String) async {
        guard let reminder = store.calendarItem(withIdentifier: id) as? EKReminder else { return }
        reminder.isCompleted = true
        save(reminder)
        await refresh()
    }

    func addReminder(_ title: String, due: Date?) async {
        let trimmed = title.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, let calendar = store.defaultCalendarForNewReminders() else { return }
        let reminder = EKReminder(eventStore: store)
        reminder.title = trimmed
        reminder.calendar = calendar
        if let due { reminder.dueDateComponents = Calendar.current.dateComponents([.year, .month, .day], from: due) }
        save(reminder)
        await refresh()
    }

    private func save(_ reminder: EKReminder) {
        do {
            try store.save(reminder, commit: true)
            lastError = nil
        } catch {
            lastError = "Couldn’t save to Reminders: \(error.localizedDescription)"
        }
    }

    /// Dated reminders first (soonest first), then undated ones.
    nonisolated static func sortReminders(_ reminders: [Reminder]) -> [Reminder] {
        reminders.sorted { a, b in
            switch (a.due, b.due) {
            case let (x?, y?): x < y
            case (.some, nil): true
            case (nil, .some): false
            case (nil, nil): a.title.localizedCompare(b.title) == .orderedAscending
            }
        }
    }

    private static func map(_ status: EKAuthorizationStatus) -> Access {
        switch status {
        case .fullAccess: .authorized
        case .notDetermined: .notDetermined
        default: .denied
        }
    }
}
