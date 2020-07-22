chrome.runtime.sendMessage({ greeting: "Hello world!" }, function (response) {
  console.log(response.farewell);
});
