var element = $('.floating-chat');
var myStorage = localStorage;

if (!myStorage.getItem('chatID')) {
  myStorage.setItem('chatID', createUUID());
}

setTimeout(function() {
  element.addClass('enter');
}, 1000);

element.click(openElement);

function openElement() {
  var messages = element.find('.messages');
  var textInput = element.find('.text-box');
  element.find('>i').hide();
  element.addClass('expand');
  element.find('.chat').addClass('enter');
  //var strLength = textInput.val().length * 2;
  textInput
    .keydown(onMetaAndEnter)
    .prop('disabled', false)
    .focus();
  element.off('click', openElement);
  element.find('.header .close').click(closeElement);
  element.find('.header .reset').click(resetChat);
  element.find('#sendMessage').click(sendNewMessage);
  messages.scrollTop(messages.prop('scrollHeight'));
}

function resetChat() {
  element.find('#scrollingChat').empty();
  $('#textInput').val('');
  let context = {};
  context.name = 'Abdullah';
  context.dna_name = 'D-NA';
  context.dna_region = 'Arabia';
  Api.sendRequest('', context);
}
function closeElement() {
  element
    .find('.chat')
    .removeClass('enter')
    .hide();
  element.removeClass('expand');
  element.find('>i').show();
  element.find('.header .reset').off('click', resetChat);
  element.find('.header .close').off('click', closeElement);
  element.find('#sendMessage').off('click', sendNewMessage);
  element
    .find('.text-box')
    .off('keydown', onMetaAndEnter)
    .prop('disabled', true)
    .blur();
  setTimeout(function() {
    element
      .find('.chat')
      .removeClass('enter')
      .show();
    element.click(openElement);
  }, 500);
}

function createUUID() {
  // http://www.ietf.org/rfc/rfc4122.txt
  var s = [];
  var hexDigits = '0123456789abcdef';
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-';

  var uuid = s.join('');
  return uuid;
}

function sendNewMessage() {
  var userInput = $('.text-box');
  var newMessage = userInput
    .html()
    .replace(/\<div\>|\<br.*?\>/gi, '\n')
    .replace(/\<\/div\>/g, '')
    .trim()
    .replace(/\n/g, '<br>');

  if (!newMessage) return;

  var messagesContainer = $('.messages');

  messagesContainer.append(['<li class="self">', newMessage, '</li>'].join(''));

  // clean out old message
  userInput.html('');
  // focus on input
  userInput.focus();

  messagesContainer.finish().animate(
    {
      scrollTop: messagesContainer.prop('scrollHeight')
    },
    250
  );
}

function onMetaAndEnter(event) {
  if ((event.metaKey || event.ctrlKey) && event.keyCode == 13) {
    sendNewMessage();
  }
}
