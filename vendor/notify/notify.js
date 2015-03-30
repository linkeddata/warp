window.addEventListener('load', function () {
  Notification.requestPermission(function (status) {
    // This allows to use Notification.permission with Chrome/Safari
    if (Notification.permission !== status) {
      Notification.permission = status;
    }
  });
});

function notify(type, body, timeout) {
  var icon = 'assets/favicon.png';
  if (!timeout) {
    var timeout = 2000;
  }

  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
  }

  // At last, if the user already denied any notification, and you 
  // want to be respectful there is no need to bother him any more.
  // Let's check if the user is okay to get some notification
  if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification(type, {
      dir: "auto",
      lang: "",
      icon: icon,
      body: body,
      tag: "notif"
    });
    setTimeout(function() { notification.close(); }, timeout);
  }
};

function authorizeNotifications() {
  var status = getNotifStatus();
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
  }

  if (status !== 'granted') {
    Notification.requestPermission(function (permission) {
      // Whatever the user answers, we make sure we store the information
      Notification.permission = permission;
    });
  } else if (status === 'granted') {
    Notification.permission = 'denied';
  }
};

function getNotifStatus() {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return undefined
  } else {
    return Notification.permission;
  }
};