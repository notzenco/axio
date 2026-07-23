//! Core workspace state and lifecycle invariants.

mod demo;
mod error;
mod lifecycle;
mod workspace;

pub use error::CoreError;
pub use workspace::Workspace;

#[cfg(test)]
mod tests;
