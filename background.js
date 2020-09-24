// Chrome Extension Utilities //
// --------------------------//

// initialize token, activeTabUrl and folderId
let token = "";
let activeTabUrl = "";
let folderId = "";

// capture the user token from the content script
chrome.runtime.onMessage.addListener(function (response, sender, sendResponse) {
  console.log(`Token response: ${response}`);
  token = response;
});

// capture the URL for the active tab if and when it changes
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == "loading") {
    console.log(`Active tab URL: ${changeInfo.url}`);
    activeTabUrl = changeInfo.url;
  }
});

// extension icon is active when the url matches hostEquals
chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: "www.dotloop.com" },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });

  // allows user to press hotkey to run extension command
  chrome.commands.onCommand.addListener(function (command) {
    // get the folderId from the URL when the command is fired
    folderId = getFolderId(activeTabUrl);
    console.log(`Folder ID: ${folderId}`);
    // one function to rule them all
    getDocumentIds(folderId);
  });
});

// Background Extension Functions //
// ------------------------------//

const getFolderId = (folderUrl) => {
  let base_url = "https://www.dotloop.com/my/templates#folder/";
  let url = folderUrl;

  let folderId = url.replace(base_url, "");

  return folderId;
};

async function getDocumentIds(selectedFolderId) {
  let ok = true;
  let batchNumber = 1;

  while (ok) {
    let response = await fetch(
      `https://www.dotloop.com/my/rest/v1_0/folder/${selectedFolderId}/document?batchNumber=${batchNumber}&batchSize=20&_=1595536501587`
    );

    let documents = await response.json();

    if (documents.length != 0) {
      let documentIds = documents.map((d) => d.documentId).filter((d) => d);

      checkIfDocumentIsLocked(documentIds);
      batchNumber++;
    } else {
      ok = false;
      alert(
        "POT is now complete! Refresh the page to see which documents are locked."
      );
    }
  }
}

async function checkIfDocumentIsLocked(ids) {
  ids.map(async (id) => {
    let response = await fetch(
      `https://www.dotloop.com/my/rest/v1_0/document/${id}/revision/0?_=1595539388679`
    );

    let document = await response.json();

    if (document.locked) {
      let documentName = document.name;
      updateDocumentName(documentName, folderId, id, token);
      console.log(`Document ID ${id} is locked. Add ** to ${documentName}`);
    }

    console.log(`Document ID ${id} is not locked.`);
  });
}

async function updateDocumentName(
  name,
  selectedFolderId,
  documentId,
  userToken
) {
  await fetch(
    `https://www.dotloop.com/my/rest/v1_0/folder/${selectedFolderId}/document/${documentId}`,
    {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "x-xsrf-token": `${userToken}`,
      },
      referrer: `https://www.dotloop.com/my/file/${documentId}/`,
      referrerPolicy: "origin-when-cross-origin",
      body: `{"name": "${"**"}${name}"}`,
      method: "PUT",
      mode: "cors",
      credentials: "include",
    }
  );
}
