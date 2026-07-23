use std::{
    collections::HashMap,
    env,
    error::Error,
    fmt,
    path::{Path, PathBuf},
    process::Command,
};

use axio_protocol::{RepositoryChange, RepositorySnapshot};

const MAX_REPOSITORY_FILES: usize = 2_500;

/// A failure to discover or inspect a local Git repository.
#[derive(Debug)]
pub enum RepositoryError {
    CurrentDirectory(std::io::Error),
    GitUnavailable(std::io::Error),
    NotFound,
    Git(String),
}

impl fmt::Display for RepositoryError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::CurrentDirectory(error) => {
                write!(formatter, "current directory is unavailable: {error}")
            }
            Self::GitUnavailable(error) => write!(formatter, "Git is unavailable: {error}"),
            Self::NotFound => formatter.write_str("no Git repository was found"),
            Self::Git(message) => write!(formatter, "Git repository inspection failed: {message}"),
        }
    }
}

impl Error for RepositoryError {}

/// Discovers the repository containing the process directory or executable.
pub fn discover_repository() -> Result<RepositorySnapshot, RepositoryError> {
    let current = env::current_dir().map_err(RepositoryError::CurrentDirectory)?;
    let mut candidates = vec![current];
    if let Ok(executable) = env::current_exe()
        && let Some(parent) = executable.parent()
    {
        candidates.push(parent.to_path_buf());
    }

    let root = candidates
        .iter()
        .find_map(|candidate| repository_root(candidate).ok())
        .ok_or(RepositoryError::NotFound)?;
    inspect_repository(&root)
}

fn repository_root(candidate: &Path) -> Result<PathBuf, RepositoryError> {
    let output = git(candidate, ["rev-parse", "--show-toplevel"])?;
    if !output.status.success() {
        return Err(RepositoryError::NotFound);
    }
    let root = String::from_utf8_lossy(&output.stdout).trim().to_owned();
    if root.is_empty() {
        return Err(RepositoryError::NotFound);
    }
    Ok(PathBuf::from(root))
}

fn inspect_repository(root: &Path) -> Result<RepositorySnapshot, RepositoryError> {
    let branch = git_text(root, ["branch", "--show-current"])?
        .trim()
        .to_owned();
    let branch = if branch.is_empty() {
        let revision = git_text(root, ["rev-parse", "--short", "HEAD"])?
            .trim()
            .to_owned();
        format!("detached@{revision}")
    } else {
        branch
    };
    let file_output = git_text(
        root,
        ["ls-files", "--cached", "--others", "--exclude-standard"],
    )?;
    let mut files: Vec<String> = file_output
        .lines()
        .map(normalize_git_path)
        .filter(|path| !path.is_empty())
        .collect();
    files.sort_unstable();
    files.dedup();
    let files_truncated = files.len() > MAX_REPOSITORY_FILES;
    files.truncate(MAX_REPOSITORY_FILES);

    let status_output = git_text(
        root,
        [
            "-c",
            "core.quotepath=false",
            "status",
            "--porcelain=v1",
            "--untracked-files=all",
        ],
    )?;
    let stats = diff_stats(root);
    let changes = parse_status(&status_output, &stats);
    let name = root
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("repository")
        .to_owned();

    Ok(RepositorySnapshot {
        root: root.to_string_lossy().into_owned(),
        name,
        branch,
        files,
        files_truncated,
        changes,
    })
}

fn git<const N: usize>(
    root: &Path,
    arguments: [&str; N],
) -> Result<std::process::Output, RepositoryError> {
    Command::new("git")
        .arg("-C")
        .arg(root)
        .args(arguments)
        .output()
        .map_err(RepositoryError::GitUnavailable)
}

fn git_text<const N: usize>(root: &Path, arguments: [&str; N]) -> Result<String, RepositoryError> {
    let output = git(root, arguments)?;
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr).trim().to_owned();
        return Err(RepositoryError::Git(message));
    }
    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

fn diff_stats(root: &Path) -> HashMap<String, (Option<u32>, Option<u32>)> {
    let Ok(output) = git(root, ["diff", "--numstat", "HEAD"]) else {
        return HashMap::new();
    };
    if !output.status.success() {
        return HashMap::new();
    }
    parse_numstat(&String::from_utf8_lossy(&output.stdout))
}

fn parse_numstat(input: &str) -> HashMap<String, (Option<u32>, Option<u32>)> {
    input
        .lines()
        .filter_map(|line| {
            let mut columns = line.splitn(3, '\t');
            let additions = parse_count(columns.next()?);
            let deletions = parse_count(columns.next()?);
            let path = normalize_git_path(columns.next()?);
            Some((path, (additions, deletions)))
        })
        .collect()
}

fn parse_status(
    input: &str,
    stats: &HashMap<String, (Option<u32>, Option<u32>)>,
) -> Vec<RepositoryChange> {
    input
        .lines()
        .filter_map(|line| {
            if line.len() < 4 {
                return None;
            }
            let status = line.get(..2)?.trim().to_owned();
            let raw_path = line.get(3..)?.trim();
            let path = normalize_git_path(
                raw_path
                    .rsplit_once(" -> ")
                    .map_or(raw_path, |(_, next)| next),
            );
            let (additions, deletions) = stats.get(&path).copied().unwrap_or((None, None));
            Some(RepositoryChange {
                path,
                status,
                additions,
                deletions,
            })
        })
        .collect()
}

fn parse_count(value: &str) -> Option<u32> {
    value.parse().ok()
}

fn normalize_git_path(path: &str) -> String {
    path.trim_matches('"').replace('\\', "/")
}

#[cfg(test)]
mod tests {
    use super::{parse_numstat, parse_status};

    #[test]
    fn parses_git_status_and_line_stats() {
        let stats = parse_numstat("12\t3\tui/src/App.tsx\n-\t-\tassets/logo.png\n");
        let changes = parse_status(
            " M ui/src/App.tsx\n?? docs/new note.md\nR  old.rs -> crates/new.rs\n",
            &stats,
        );

        assert_eq!(changes.len(), 3);
        assert_eq!(changes[0].path, "ui/src/App.tsx");
        assert_eq!(changes[0].additions, Some(12));
        assert_eq!(changes[0].deletions, Some(3));
        assert_eq!(changes[1].path, "docs/new note.md");
        assert_eq!(changes[2].path, "crates/new.rs");
    }
}
