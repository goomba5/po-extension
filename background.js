// Global Variables //
//-----------------//

let token = "";
let activeTabUrl = "";
let folderId = "";
let allDocumentIds = [];
let totalUnlockedDocuments = 0;
let totalLockedDocuments = 0;
let totalDocuments = 0;

// Chrome Extension Utilities //
//---------------------------//

// capture the user token from the content script
chrome.runtime.onMessage.addListener(function (response, sender, sendResponse) {
  console.log(`Token response: ${response}`);
  token = response;
});

// capture the URL for the active tab if and when it changes
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == "loading") {
    activeTabUrl = changeInfo.url;
    console.log(`Active tab URL: ${changeInfo.url}`);

    folderId = getFolderId(activeTabUrl);
    console.log(`Folder ID: ${folderId}`);

    getAllDocumentIds(folderId).then(data => {
      let total = data.flat().length;
      let docIds = data.flat();
      allDocumentIds = docIds;
      totalDocuments = total;
      
      return allDocumentIds;
    }).then(docIds => {
      checkIfDocumentIsLocked(docIds).then(documents => {
        totalLockedDocuments = documents.length;
        let unlockedDocuments = totalDocuments - totalLockedDocuments;
        totalUnlockedDocuments = unlockedDocuments;
        displayDocumentTotals(totalDocuments, totalLockedDocuments, totalUnlockedDocuments);
      });
    });
  }
});

// extension icon is active when the url matches hostEquals
chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: "https://www.dotloop.com" },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });

  // allows user to press hotkey to run extension command
  chrome.commands.onCommand.addListener(function (command) {
    if (command === "scan-documents") {
      // one function to rule them all
      checkIfDocumentIsLocked(allDocumentIds).then((docs) => {
        docs.forEach(document => {
          let documentName = document.name;
          let docFolderId = document.folderId;
          let documentId = document.documentId;

          updateDocumentName(documentName, docFolderId, documentId, token);
        })
      }).then(() => {
        alertDocumentTotals(totalDocuments, totalLockedDocuments, totalUnlockedDocuments);
      })
    }
  });
});

// Background Extension Functions //
//-------------------------------//

const getFolderId = (folderUrl) => {
  let url = folderUrl;
  let base_url = "https://www.dotloop.com/my/templates#folder/";

  let folderId = url.replace(base_url, "");

  return folderId;
};

/*
https://www.dotloop.com/my/rest/v1_0/folder/110788604/document?batchNumber=2&batchSize=20&_=1604609453105
*/

async function getAllDocumentIds(selectedFolderId) {
  let batchNumber = 1;
  let allDocIds = [];

  let response = await fetch(
    `https://www.dotloop.com/my/rest/v1_0/folder/${selectedFolderId}/document?batchNumber=${batchNumber}&batchSize=20&_=1595536501587`
  );

  let documents = await response.json();
  let parsedIds = documents.map((d) => d.documentId).filter((d) => d);

  if (documents.length != 0) {
    totalDocuments += parsedIds.length;
    allDocIds.push(parsedIds);
  }
  return allDocIds;
}

async function checkIfDocumentIsLocked(ids) {
  let lockedDocumentList = [];
  let requestedDocuments = ids.map(async (id) => {
    let response = await fetch(
      `https://www.dotloop.com/my/rest/v1_0/document/${id}/revision/0?_=1595539388679`
    );

    let data = await response.json();
    return data;
  })

  let documents = await Promise.all(requestedDocuments);

  for(let document of documents){
    if(document.locked == true){
      lockedDocumentList.push(document);
    }
  }
  return lockedDocumentList;
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

const displayDocumentTotals = (total, locked, unlocked) => {
  console.log(`Total documents: ${total}
  Total locked documents: ${locked}
  Total unlocked documents: ${unlocked}`);
}

const alertDocumentTotals = (total, locked, unlocked) => {
  alert(`Total documents: ${total}
  Total unlocked documents: ${unlocked}
  Total locked documents: ${locked}`);
}
