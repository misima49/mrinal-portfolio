var typed = new Typed('#typed', {
  stringsElement: '#typed-strings',
  loop: true,
  typeSpeed: 100,
  backSpeed: 20,
  showCursor: true,
  smartBackspace: false,
});

document.addEventListener('aos:in:skill-bars', ({ detail }) => {
  $(".progress-bar").each(function (i) {
    $(this).delay(500 * i).animate({
      width: $(this).attr('aria-valuenow') + '%'
    }, 500);
  });
});

$(".nav-item i").mouseover(function (e) {
  console.log($(e.target).text());
  switch ($(e.target).text()) {
    case "home": $("<span> Home</span>").insertAfter($(e.target));
      break;
    case "engineering": $("<span> Skills</span>").insertAfter($(e.target));
      break;
    case "description": $("<span> About</span>").insertAfter($(e.target));
      break;
    case "code": $("<span> Projects</span>").insertAfter($(e.target));
      break;
    case "email": $("<span> Contact me</span>").insertAfter($(e.target));
      break;
  }
}).mouseout(function (e) {
  $(e.target).next().remove();
})

