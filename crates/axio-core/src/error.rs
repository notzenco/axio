use std::{error::Error, fmt};

use axio_protocol::AgentStatus;

/// A rejected orchestration operation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CoreError {
    AgentNotFound(String),
    TaskNotFound(String),
    EmptyTaskTitle,
    EmptyDirection,
    InvalidTransition {
        id: String,
        from: AgentStatus,
        to: AgentStatus,
    },
}

impl fmt::Display for CoreError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::AgentNotFound(id) => write!(formatter, "agent not found: {id}"),
            Self::TaskNotFound(id) => write!(formatter, "task not found: {id}"),
            Self::EmptyTaskTitle => formatter.write_str("task title cannot be empty"),
            Self::EmptyDirection => formatter.write_str("direction cannot be empty"),
            Self::InvalidTransition { id, from, to } => {
                write!(formatter, "invalid transition for {id}: {from:?} -> {to:?}")
            }
        }
    }
}

impl Error for CoreError {}
