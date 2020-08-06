//** NOTES **//
/*
KEY INFO:
--------

TO-DO LIST:
----------
- create a loop that checks for additional batchNumbers
- create a way to capture the xsrf-token from the user

DONE
----
$ create a function that accepts a documentId and prepends documentName with "**" when locked is TRUE
$ add an alert which informs the user that POT has completed its task
$ capture folderId when user clicks the folder

*/

// Capture folderId //
// --------------- //

let folderId = "";

chrome.runtime.onMessage.addListener(function (response, sender, sendResponse) {
  folderId = response;
});

// Chrome Extension Utilities //
// --------------------------//

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

    getDocumentIds(folderId);
  });
});

// Background Extension Functions //
// ------------------------------//

async function getDocumentIds(folderId) {
  let ok = true;
  let batchNumber = 1;

  while (ok) {
    let response = await fetch(
      `https://www.dotloop.com/my/rest/v1_0/folder/${folderId}/document?batchNumber=${batchNumber}&batchSize=20&_=1595536501587`
    );

    let documents = await response.json();

    if (documents.length == 0) {
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
      console.log(`Document ID ${id} is locked. Add ** to ${documentName}`);
      updateDocumentName(documentName, folderId, id);
    }

    console.log(`Document ID ${id} is not locked.`);
  });
}

async function updateDocumentName(name, selectedFolderId, documentId) {
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
        "x-xsrf-token": "",
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
