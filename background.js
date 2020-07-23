const DOCUMENT_FETCH_URL = "https://www.dotloop.com/my/rest/v1_0/folder";

async function getDocumentIds(folderId) {
  let response = await fetch(
    `https://www.dotloop.com/my/rest/v1_0/folder/${folderId}/document?batchNumber=1&batchSize=20&_=1595536501587`
  );

  let documents = await response.json();
  console.log(documents);

  let documentIds = documents.map((d) => d.documentId).filter((d) => d);
  console.log(documentIds);

  return documentIds;
}

async function getDocumentData(documentId) {
  let response = await fetch(
    `https://www.dotloop.com/my/rest/v1_0/document/${documentId}/revision/0?_=1595539388679`
  );

  let document = await response.json();
  console.log(document);

  return document;
}

chrome.runtime.onInstalled.addListener(function () {
  // extension icon is active when the url matches hostEquals
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
    console.log("Hotkey command: " + command);
    getDocumentIds(23923629);
  });
});
