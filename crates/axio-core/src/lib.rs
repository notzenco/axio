//! Core workspace state and lifecycle invariants.

mod demo;
mod error;
mod lifecycle;
mod repository;
mod workspace;

pub use error::CoreError;
pub use repository::{RepositoryError, discover_repository};
pub use workspace::Workspace;

#[cfg(test)]
mod tests;
