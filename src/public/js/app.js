function init() {
  getPosts(true);
  setInterval(getPosts, 5000);
}

function post(event) {
  event.preventDefault();
  text = event.target.elements.text.value;

  fetch("/api/post", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: text,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Request failed.");
      }
      const input = document.getElementById("new-post-input");
      input.value = "";
      getPosts();
    })
    .catch((error) => {
      console.error(error);
    });

  return false;
}

function getPosts(isInit = false) {
  fetch("/api/post")
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Request failed.");
    })
    .then((data) => {
      // get element with class scrollable
      const scrollable = document.getElementById("posts-container");
      // remove all children
      // while (scrollable.firstChild) {
      //   scrollable.removeChild(scrollable.firstChild);
      // }
      // for each post, add a new div
      data.forEach((post) => {
        // very simple merge behavior
        // if the post exists in the DOM already, skip rendering it and move
        // onto its children
        const existingPost = document.getElementById(`post-${post.id}`);
        if (existingPost) {
          post.comments.forEach((comment) =>
            checkForCommentAndBuild(existingPost, comment)
          );
        } else {
          const div = document.createElement("div");
          div.classList.add("post-container");
          div.id = `post-${post.id}`;

          div.appendChild(buildPost(post));
          div.appendChild(buildForm(post.id));
          post.comments.forEach((comment) => {
            div.appendChild(buildComment(comment));
          });
          if (isInit) {
            scrollable.appendChild(div);
          } else {
            scrollable.prepend(div);
          }
        }
      });
    })
    .catch((error) => {
      console.error(error);
    });
}

function switchReplyVisibility(commentId) {
  const commentContainerEl = document.getElementById(commentId);

  const buttonEl = commentContainerEl.getElementsByClassName("reply")[0];

  const responseEl = commentContainerEl.getElementsByClassName("response")[0];

  if (responseEl.classList.contains("hidden")) {
    responseEl.classList.remove("hidden");
    buttonEl.textContent = "↑";
  } else {
    responseEl.classList.add("hidden");
    buttonEl.textContent = "↵";
  }
}

async function commentCreate(data) {
  try {
    const res = await fetch("/api/comment", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("Request failed.");
    }
    getPosts();
  } catch (err) {
    console.error(err);
  }
}

// DOM functions

function buildPost(post) {
  const container = document.createElement("div");
  container.classList.add("comment", "post");

  container.appendChild(buildContent(post.content, post.createdOn));
  container.appendChild(buildReplyButton(`post-${post.id}`));

  return container;
}

function buildForm(postID, comment) {
  const form = document.createElement("form");
  form.classList.add("response", "hidden");

  const postIDInput = document.createElement("input");
  postIDInput.type = "hidden";
  postIDInput.name = "postId";
  postIDInput.value = postID;
  form.appendChild(postIDInput);

  if (comment) {
    const commentIDInput = document.createElement("input");
    commentIDInput.type = "hidden";
    commentIDInput.name = "commentId";
    commentIDInput.value = comment.id;
    form.appendChild(commentIDInput);
  }

  const commentInput = document.createElement("input");
  commentInput.type = "text";
  commentInput.name = "text";
  commentInput.placeholder = "Add a comment";
  form.appendChild(commentInput);

  form.onsubmit = async (e) => {
    e.preventDefault();
    await commentCreate({
      content: commentInput.value,
      postId: postID,
      repliesToCommentId: comment?.id,
    });
    commentInput.value = "";
    if (comment) {
      switchReplyVisibility(`comment-${comment.id}`);
    } else {
      switchReplyVisibility(`post-${postID}`);
    }
  };

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.innerHTML = "✉";
  form.appendChild(submitButton);

  return form;
}

function buildReplyButton(id) {
  const replyButton = document.createElement("button");
  replyButton.classList.add("reply");
  replyButton.onclick = () => switchReplyVisibility(id);
  replyButton.innerHTML = "↵";
  return replyButton;
}

function checkForCommentAndBuild(parent, comment) {
  const existingComment = document.getElementById(`comment-${comment.id}`);
  if (existingComment) {
    comment.comments?.forEach((c) =>
      checkForCommentAndBuild(existingComment, c)
    );
  } else {
    parent.appendChild(buildComment(comment));
  }
}

function buildComment(comment) {
  const container = document.createElement("div");
  container.classList.add("post-container", "indented");
  container.id = `comment-${comment.id}`;

  const commentElement = document.createElement("div");
  commentElement.classList.add("comment");

  commentElement.appendChild(buildContent(comment.content, comment.createdOn));
  commentElement.appendChild(buildReplyButton(`comment-${comment.id}`));
  container.appendChild(commentElement);

  container.appendChild(buildForm(comment.postId, comment));

  if (comment.comments) {
    comment.comments.forEach((c) => {
      container.appendChild(buildComment(c));
    });
  }

  return container;
}

const conv = new showdown.Converter();

function buildContent(content, date) {
  const contentContainer = document.createElement("div");
  contentContainer.classList.add("comment-content");

  const contentElement = document.createElement("p");
  contentElement.classList.add("content");
  contentElement.innerHTML = conv.makeHtml(content);

  const dateElement = document.createElement("p");
  dateElement.classList.add("date");
  dateElement.innerHTML = date;

  contentContainer.appendChild(contentElement);
  contentContainer.appendChild(dateElement);

  return contentContainer;
}

async function search(event) {
  event.preventDefault();
  const search = event.target.elements.text.value;

  if (search == "") {
    document.getElementById("posts-container").classList.remove("hidden");
    document.getElementById("search-results").classList.add("hidden");

    return false;
  } else {
    document.getElementById("posts-container").classList.add("hidden");
    document.getElementById("search-results").classList.remove("hidden");
  }

  console.log(search);

  const [posts, comments] = await Promise.all([
    fetch(`/api/post/search?search=${encodeURIComponent(search)}&limit=5`).then(
      (res) => res.json()
    ),
    fetch(
      `/api/comment/search?search=${encodeURIComponent(search)}&limit=20`
    ).then((res) => res.json()),
  ]);

  console.log(posts);
  console.log(comments);

  const scrollable = document.getElementById("search-results");
  while (scrollable.firstChild) {
    scrollable.removeChild(scrollable.firstChild);
  }

  const titlePostsEl = document.createElement("h2");
  titlePostsEl.textContent = "Posts";
  scrollable.appendChild(titlePostsEl);

  posts.forEach((post) => {
    post.comments = [];

    const div = document.createElement("div");
    div.classList.add("post-container");
    div.id = `post-${post.id}`;

    div.appendChild(buildPost(post));
    div.appendChild(buildForm(post.id));
    post.comments.forEach((comment) => {
      div.appendChild(buildComment(comment));
    });

    scrollable.appendChild(div);
  });

  const titleCommentsEl = document.createElement("h2");
  titleCommentsEl.textContent = "Comments";
  scrollable.appendChild(titleCommentsEl);

  comments.forEach((comment) => {
    comment.comments = [];
    scrollable.appendChild(buildComment(comment));
  });

  return false;
}
