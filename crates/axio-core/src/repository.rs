use std::{
    collections::HashMap,
    env,
    error::Error,
    fmt,
    fs::File,
    io::Read,
    path::{Path, PathBuf},
    process::Command,
};

use axio_protocol::{RepositoryChange, RepositoryFileContent, RepositorySnapshot};

const MAX_REPOSITORY_FILES: usize = 2_500;
const MAX_FILE_PREVIEW_BYTES: u64 = 256 * 1024;

/// A failure to discover or inspect a local Git repository.
#[derive(Debug)]
pub enum RepositoryError {
    CurrentDirectory(std::io::Error),
    GitUnavailable(std::io::Error),
    NotFound,
    Git(String),
    InvalidPath(String),
    FileRead {
        path: String,
        source: std::io::Error,
    },
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
            Self::InvalidPath(path) => {
                write!(formatter, "path is outside the active repository: {path}")
            }
            Self::FileRead { path, source } => write!(formatter, "failed to read {path}: {source}"),
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

/// Opens the Git repository containing an explicitly selected folder.
pub fn open_repository(path: impl AsRef<Path>) -> Result<RepositorySnapshot, RepositoryError> {
    let path = path.as_ref();
    let root = repository_root(path)?;
    inspect_repository(&root)
}

/// Reads a bounded text preview without allowing paths to escape the repository.
pub fn read_repository_file(
    repository: &RepositorySnapshot,
    path: &str,
) -> Result<RepositoryFileContent, RepositoryError> {
    let relative = Path::new(path);
    if relative.is_absolute()
        || relative
            .components()
            .any(|component| !matches!(component, std::path::Component::Normal(_)))
    {
        return Err(RepositoryError::InvalidPath(path.to_owned()));
    }

    let root = Path::new(&repository.root)
        .canonicalize()
        .map_err(|source| RepositoryError::FileRead {
            path: repository.root.clone(),
            source,
        })?;
    let target =
        root.join(relative)
            .canonicalize()
            .map_err(|source| RepositoryError::FileRead {
                path: path.to_owned(),
                source,
            })?;
    if !target.starts_with(&root) {
        return Err(RepositoryError::InvalidPath(path.to_owned()));
    }

    let size_bytes = target
        .metadata()
        .map_err(|source| RepositoryError::FileRead {
            path: path.to_owned(),
            source,
        })?
        .len();
    let mut bytes = Vec::new();
    File::open(&target)
        .map_err(|source| RepositoryError::FileRead {
            path: path.to_owned(),
            source,
        })?
        .take(MAX_FILE_PREVIEW_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|source| RepositoryError::FileRead {
            path: path.to_owned(),
            source,
        })?;
    let truncated = bytes.len() as u64 > MAX_FILE_PREVIEW_BYTES;
    bytes.truncate(MAX_FILE_PREVIEW_BYTES as usize);
    let binary = bytes.contains(&0) || std::str::from_utf8(&bytes).is_err();
    let content = (!binary).then(|| String::from_utf8_lossy(&bytes).into_owned());

    Ok(RepositoryFileContent {
        path: path.replace('\\', "/"),
        content,
        size_bytes,
        truncated,
        binary,
    })
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
    use std::{
        fs,
        time::{SystemTime, UNIX_EPOCH},
    };

    use axio_protocol::RepositorySnapshot;

    use super::{RepositoryError, parse_numstat, parse_status, read_repository_file};

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

    #[test]
    fn reads_text_inside_repository_and_rejects_parent_paths() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be valid")
            .as_nanos();
        let root = std::env::temp_dir().join(format!("axio-repository-read-{unique}"));
        fs::create_dir_all(root.join("src")).expect("test directory should be created");
        fs::write(root.join("src/main.rs"), "fn main() {}\n").expect("test file should be written");
        let repository = RepositorySnapshot {
            root: root.to_string_lossy().into_owned(),
            name: "example".to_owned(),
            branch: "main".to_owned(),
            files: vec!["src/main.rs".to_owned()],
            files_truncated: false,
            changes: Vec::new(),
        };

        let content =
            read_repository_file(&repository, "src/main.rs").expect("text file should be readable");
        assert_eq!(content.content.as_deref(), Some("fn main() {}\n"));
        assert!(!content.binary);
        assert!(matches!(
            read_repository_file(&repository, "../outside"),
            Err(RepositoryError::InvalidPath(_))
        ));

        fs::remove_dir_all(&root).expect("test directory should be removed");
    }
}
