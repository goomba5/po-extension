const getFolderId = () => {
  let base_url = "https://www.dotloop.com/my/templates#folder/";
  let url = window.location.href;
  // https://www.dotloop.com/my/templates#folder/23923629
  let folderId = url.replace(base_url, "");

  return folderId;
};

document.querySelectorAll("li.section-item").forEach((folder) => {
  folder.addEventListener("click", getFolderId);
});

let folderId = getFolderId();

console.log("The folderId is " + folderId);

chrome.runtime.sendMessage(folderId);
