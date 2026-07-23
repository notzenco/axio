use axio_protocol::AgentStatus;

pub(crate) const fn can_transition(from: AgentStatus, to: AgentStatus) -> bool {
    use AgentStatus::{Completed, Failed, Idle, Running, Starting, Waiting};

    matches!(
        (from, to),
        (Idle, Starting)
            | (Starting, Running | Failed)
            | (Running, Waiting | Completed | Failed)
            | (Waiting, Running | Completed | Failed)
            | (Completed | Failed, Starting)
    ) || from as u8 == to as u8
}
