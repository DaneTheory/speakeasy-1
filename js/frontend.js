$(document).ready(function() {
  var langs = 
  [['English',         ['en-US', 'United States']],
   ['Español',         ['es-ES', 'España']]
  ];


  for (var i = 0; i < langs.length; i++) {
    select_language.options[i] = new Option(langs[i][0], i);
  }
  select_language.selectedIndex = 0;
  updateCountry();
  select_dialect.selectedIndex = 0;
  showInfo('info_start');

  window.updateCountry = function updateCountry() {
    for (var i = select_dialect.options.length - 1; i >= 0; i--) {
      select_dialect.remove(i);
    }
    var list = langs[select_language.selectedIndex];
    for (var i = 1; i < list.length; i++) {
      select_dialect.options.add(new Option(list[i][1], list[i][0]));
    }
    select_dialect.style.visibility = list[1].length == 1 ? 'hidden' : 'visible';
  }

  function updateCountry() {
    for (var i = select_dialect.options.length - 1; i >= 0; i--) {
      select_dialect.remove(i);
    }
    var list = langs[select_language.selectedIndex];
    for (var i = 1; i < list.length; i++) {
      select_dialect.options.add(new Option(list[i][1], list[i][0]));
    }
    select_dialect.style.visibility = list[1].length == 1 ? 'hidden' : 'visible';
  }

  var create_email = false;
  var final_transcript = '';
  var recognizing = false;
  var ignore_onend;
  var start_timestamp;
  if (!('webkitSpeechRecognition' in window)) {
    upgrade();
  } else {
    start_button.style.display = 'inline-block';
    var recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = function() {
      recognizing = true;
      showInfo('info_speak_now');
      start_img.src = 'img/mic-animate.gif';
    };

    recognition.onerror = function(event) {
      console.log("error: " + event.error);
    };

    recognition.onend = function() {
      socket.emit("sendMessage", {message: final_span.innerHTML,language: $("#select_dialect").val().split("-")[0]});

      recognizing = false;
      if (ignore_onend) {
        return;
      }
      start_img.src = 'img/mic.gif';
      if (!final_transcript) {
        showInfo('info_start');
        return;
      }
      showInfo('');
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
        var range = document.createRange();
        range.selectNode(document.getElementById('final_span'));
        window.getSelection().addRange(range);
      }
    };

    recognition.onresult = function(event) {
      var interim_transcript = '';
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }
      final_transcript = capitalize(final_transcript);
      final_span.innerHTML = linebreak(final_transcript);
      interim_span.innerHTML = linebreak(interim_transcript);
    };
  }

  function upgrade() {
    console.log("need to update to Chrome Beta");
  }

  var two_line = /\n\n/g;
  var one_line = /\n/g;
  function linebreak(s) {
    return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
  }

  var first_char = /\S/;
  function capitalize(s) {
    return s.replace(first_char, function(m) { return m.toUpperCase(); });
  }

  window.startButton = function startButton() {
    if (recognizing) {
      recognition.stop();
      return;
    }
    final_transcript = '';
    recognition.lang = select_dialect.value;
    recognition.start();
    ignore_onend = false;
    final_span.innerHTML = '';
    interim_span.innerHTML = '';
    start_img.src = 'img/mic-slash.gif';
    start_timestamp = event.timeStamp;
  }

  function showInfo(s) {
    if (s) {
      for (var child = info.firstChild; child; child = child.nextSibling) {
        if (child.style) {
          child.style.display = child.id == s ? 'inline' : 'none';
        }
      }
      info.style.visibility = 'visible';
    } else {
      info.style.visibility = 'hidden';
    }
  }

  var socket = io.connect('http://speakeasyhack.jit.su');
  $("#usr-btn").click(function() {
    var username = $("#username").val();
    socket.emit('setName', username);
  });

  socket.on('usernameIsSet', function() {
    $("#welcome").fadeOut("fast", function() {
      $("#first_thing").fadeIn("slow");
    });
  });

  $("#btn-create").click(function() {
    socket.emit('createRoom');
    $("#first_thing").fadeOut("fast", function() {
      $("#second_thing").fadeIn("slow");
    });
  });

  socket.on('new_join', function(userInfo) {
    console.log(userInfo);
    $("#roomnumber").text(userInfo.roomName);
    $("#guests").append("<div>"+userInfo.username+"</div>");
  });

  $("#btn-join").click(function() {
    var roomname = $("#room-name").val();
    socket.emit("joinRoom", roomname);
    $("#first_thing").fadeOut("fast", function() {
      $("#second_thing").fadeIn("slow");
    });
  });

  socket.on('too_many', function() {
    $("#roomnumber").text("too many people in the room!");
  });

  socket.on('newMessage', function(m) {
    //console.log(m);
    var mylang = $("#select_dialect").val().split("-")[0];
    //console.log(m.message);
    //console.log(mylang);
    //console.log(m.language);

    if(mylang == m.language) {
      $("#final_span").text("");
      $("#conversation").append("<div>"+m.username+": "+m.message+"</div>");
      speak(m.message);
    } else {
      $.getJSON("https://www.googleapis.com/language/translate/v2?key=AIzaSyA1_IbVGC_yDh3h7jRtZlgAXcrj2jFvPFA&source="+m.language+"&target="+mylang+"&q="+m.message+"", function(d) {
        console.log(d)
        console.log(d.data.translations[0].translatedText);
        $("#final_span").text("");
        $("#conversation").append("<div>"+m.username+": "+d.data.translations[0].translatedText+"</div>");
        speak(d.data.translations[0].translatedText);
      });
    }

  });



});










