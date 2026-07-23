//! Core workspace state and lifecycle invariants.

mod demo;
mod error;
mod lifecycle;
mod repository;
mod workspace;

pub use error::CoreError;
pub use repository::{RepositoryError, discover_repository, read_repository_file};
pub use workspace::Workspace;

#[cfg(test)]
mod tests;
