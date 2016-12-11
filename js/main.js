function highlightMenuItem(id) {
    var allMenuItems = $('.ui.menu:not(.pagination) .item');
    allMenuItems.removeClass('active');
    allMenuItems.filter(`a[href='#${id}']`).addClass('active');
}

$(() => {
    $('.ui.radio.checkbox').checkbox();
    // create sidebar and attach to menu open
    $('.ui.sidebar').sidebar('attach events', '.toc.item');

    $(document).on('click', '.ui.menu:not(.pagination) a.item', function(event) {
        event.preventDefault();

        $('html, body').animate({
            scrollTop: $($.attr(this, 'href')).offset().top - 80
        }, 500);
    });

    $('.section').each((index, element) => {
        var el = $(element);
        el.visibility({
            once: false,
            onTopPassed: function() {
                // top is on screen
                var elementId = el.attr('id');
                highlightMenuItem(elementId);
            },
            onBottomPassedReverse: function() {
                var elementId = el.attr('id');
                highlightMenuItem(elementId);
            }
        })
    });
});
