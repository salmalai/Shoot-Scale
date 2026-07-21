# Drive adapter contract

The skills describe file work as **intent**. To run them in any environment, the runtime must provide
these operations. In Cowork they map to the Drive connector + mounted filesystem; in the Shoot &
Scale app they map to Google Drive/Docs API calls. The skill logic never changes — only this thin
layer does.

## The operations

| Operation | Purpose | Cowork mapping | App (Google API) mapping |
|---|---|---|---|
| `list_folder(path)` | see what's in a client/shoot folder | `ls` on the mount | `files.list` with `q: '<folderId> in parents'` |
| `ensure_folder(path)` | create `Content/Shoot N/{Raw Videos,Edited Videos,Scripts}` if missing | `mkdir -p` | `files.create` mimeType `application/vnd.google-apps.folder` |
| `read_doc(ref)` | get a `.docx`'s current bytes | copy from mount / connector download | `files.get` `alt=media` (or `files.export`) |
| `read_comments(ref)` | get the client's comments | parse `comments.xml` from the bytes | `comments.list` (Drive Comments API) |
| `write_doc(path, bytes)` | create a NEW doc, return id + link | write to mount | `files.create` with media upload |
| `update_doc(ref, bytes)` | overwrite the SAME doc in place (same id, same link) | overwrite the same mount path | `files.update` with media upload on the fileId |

## Rules that matter for both environments

1. **Same-file updates keep the link.** `/revise` and any in-place edit MUST use `update_doc` on the
   existing fileId — never `write_doc` (that makes a new link). In Cowork, overwriting the same path
   preserves the Drive file id; via the API, `files.update` does.
2. **Read right before write.** Always `read_doc` immediately before `update_doc` so a concurrent
   client edit isn't clobbered (whole-file swap).
3. **The verdict lives in the body, not the comments.** `read_comments` (or the Comments API) gives
   you the *why*; the green/yellow/red **verdict** is a highlight in the document body, so you still
   parse the `.docx` bytes (`scripts/read_review.py`) to get it. Both environments do this the same way.
4. **Lock/sync tolerance.** A just-edited Drive file may be briefly unreadable (Cowork: "resource
   deadlock"; API: a moment of propagation). Wait-and-retry; don't fail.
5. **Portable core.** `read_review.py` (parse review → JSON) and `build_script_doc.py` (JSON → branded
   `.docx`) run on bytes only and are identical in both environments. Only the six operations above
   are swapped.
