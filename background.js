let commandTest = () => {
  console.log("Command test");
};

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

  chrome.runtime.onMessage.addListener(function (request, sender, response) {
    console.log(
      sender.tab
        ? "from a content script: " + sender.tab.url
        : "from an extentions"
    );
    if (request.greeting == "Hello world!") {
      sendResponse({ farewell: "Goodbye!" });
    }
  });

  // allows user to press hotkey to run extension command
  chrome.commands.onCommand.addListener(function (command) {
    console.log("Hotkey command: " + command);
    commandTest();
  });
});
