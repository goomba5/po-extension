// Content Script Functions //
//-------------------------//

const getToken = () => {
  let cookie = window.document.cookie;

  const xsrfRegex = /XSRF\-TOKEN=\S+;/;
  const tokenRegex = /(?<=XSRF\-TOKEN=)\S+\w/;

  let fullXsrfString = cookie.match(xsrfRegex)[0];

  let token = fullXsrfString.match(tokenRegex)[0];

  return token;
};

// Chrome Content Script Utilities //
//--------------------------------//
let userToken = getToken();

chrome.runtime.sendMessage(userToken);
