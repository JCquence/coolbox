/*!
 *	=============
 *	   CoolBox
 *	=============
 *
 *	Version: 0.1.0
 *	Date: 7th June, 2015 - 12:57 GMT+1
 *
 *	(c) 2009, 2015 Jelle van der Coelen.
 *	https://jellevandercoelen.com | jelle@jellevandercoelen.com
 *
 *	Distributed under the Creative Commons Attribution-Noncommercial-Share Alike 3.0 Netherlands
 *	https://creativecommons.org/licenses/by-nc-sa/3.0/nl/deed.en_US
 *
 *	-------------------------------------------------------
 *	Build for Jquery
 *	(c) 2005, 2015 jQuery Foundation, Inc. | https://jquery.org/license
 *	-------------------------------------------------------
 */

/* HELPERS */

/**
 * Controller
 * @var object
 */
var cb = {vars: {}, helpers: {}};

/**
 * Hold CoolBox objects
 * @var array
 */
cb.vars.coolboxes = new Array();

/**
 * Initial z-index
 * @var int
 */
cb.vars.initialZIndex = 9999;

/**
 * RegExp for testing images
 * @var regexp
 */
cb.vars.isImage = /(jpeg|jpg|gif|png)/i;

/**
 * Provide closure for loops
 *
 * @param object   opts
 * @param function callback
 *
 * @return function
 */
cb.helpers.closure = function(opts, callback){ return function(){ callback(opts); }; };

/**
 * Return the active CoolBox
 *
 * @return void
 */
cb.helpers.getActiveCoolBox = function()
{
    if(typeof cb.vars.coolboxes[jQuery('.cb.cb-active').data('cb')] != 'undefined')
        return cb.vars.coolboxes[jQuery('.cb.cb-active').data('cb')];
    else
        return {kill: function(){}, previous: function(){}, next: function(){}};
};

/**
 * Return correct value for property according to browser
 *
 * @param string property
 *
 * @return mixed
 */
cb.helpers.getProperty = function(e, prop)
{
    var p;
    var properties =
    {
        duration: ['transitionDuration',
                   'WebkitTransitionDuration',
                   'MozTransitionDuration',
                   'msTransitionDuration',
                   'OTransitionDuration']
    };

    while((p = properties[prop].shift()))
        if(typeof e.css(p) != 'undefined')
            return e.css(p);

    return false;
};

/**
 * Manually hide loader
 * 
 * @return void
 */
cb.helpers.hideLoader = function()
{
    $('.cb-loader').css({opacity: 0});
    setTimeout(function(){ $('.cb-loader').css({zIndex: -1}) }, 100);
};

/**
 * Generate a random string
 *
 * @param int length
 *
 * @return string
 */
cb.helpers.randStr = function(l)
{
    if(!l)
        l = 15;
    
    var str = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < l; i++)
        str += possible.charAt(Math.floor(Math.random() * possible.length));

    return str;
};


/**
 * Document ready
 */
jQuery(function()
{
    // --- stop propagation
    jQuery(document).on('click', '.cb', function(ev){ ev.stopPropagation(); });

    // --- append overlay
    jQuery('body').append('<div class="cb-overlay"></div>');
    jQuery('body').append('<div class="cb-loader"></div>');

    // --- key
    jQuery(document).keyup(function(ev)
    {
        if(ev.keyCode == 27)
            cb.helpers.getActiveCoolBox().kill();

        if(ev.keyCode == 37)
            cb.helpers.getActiveCoolBox().previous();

        if(ev.keyCode == 39)
            cb.helpers.getActiveCoolBox().next();
    });
});


/* COOLBOX */
var CoolBox = function(options, element)
{
    // --- options
    var defaults =
    {
        appendCloseBtn : true,  //append close button 
        'class'        : '',    //extra class(es) to append to .cb
        content        : '',    //content to show if href = false
        fixed          : false, //set .cb position fixed
        group          : false, //group
        height         : 300,   //height
        href           : false, //url to open
        loader         : true,  //show loader
        offset         : 50,    //space for images to bounds
        onComplete     : false, //callback: everything loaded correctly
        onContentLoaded: false, //callback: content is loaded
        onKill         : false, //callback: kill function is run
        onKilled       : false, //callback: killing is complete
        overlay        :
        {
            color  : '#000000', //overlay backgroundcolor
            enable : true,      //show overlay
            keep   : false,     //keep overlay after killing
            opacity: 0.7,       //overlay opacity
        },
        postvars       : {},
        responsive     :
        {
            enabled: false,     //enable responsive settings, set to width
            height : false,
            width  : '90%',     //switch to this width
        },
        title          : false, //title to display
        x              : false, //x
        y              : false, //y
        width          : 400    //width
    };

    var opts = jQuery.extend(true, defaults, options);

    /**
     * Opening element
     * @var jQuery object
     */
    var e = element;

    /**
     * Active CoolBox?
     * @var boolean
     */
    var isActive = false;

    /**
     * Open CoolBox?
     * @var boolean
     */
    var isOpen = false;

    /**
     * Current X
     * @var int
     */
    var x;

    /**
     * Current Y
     * @var int
     */
    var y;

    /**
     * Return corresponding jQuery object
     *
     * @return object
     */
    function box(){ return jQuery('.cb[data-cb=' + ID + ']'); };

    /**
     * Calculate new image dimensions
     *
     * @param object img
     *
     * @return array
     */
    function calculateNewDimensions(img)
    {
        var h = img.height;
        var w = img.width;
        
        var cbh = jQuery('.cb-overlay').outerHeight();
        var cbw = jQuery('.cb-overlay').outerWidth();
        
        var ratio = (w > h ? (h / w) : (w / h));
                            
        if(h > (cbh - opts.offset))
        {
            nh = (cbh - opts.offset);
            nw = (h > w ? ((cbh - opts.offset) * ratio) : (nh / ratio));
            
            w = nw;
            h = nh;
        };
        
        if(w > (cbw - opts.offset))
        {
            nw = (cbw - opts.offset);
            nh = (w > h ? ((cbw - opts.offset) * ratio) : (nw / ratio));
            
            w = nw;
            h = nh;
        };
        
        return [parseInt(w), parseInt(h)];
    };

    /**
     * Do a callback if set
     *
     * @return void
     */
    function doCallback(c)
    {
        if(typeof opts['on' + c] == 'function')
            return opts['on' + c](ret, opts);
    };

    /**
     * Hide overlay
     *
     * @return void
     */
    function hideOverlay()
    {
        jQuery('.cb-overlay, .cb-loader').css({opacity: 0}).unbind('click');
        setTimeout(function(){ jQuery('.cb-overlay, .cb-loader').css({zIndex: -1}); });
    };

    /**
     * Kill CoolBox
     *
     * @return void
     */
    function kill(keepOverlay)
    {
        doCallback('Kill');

        box().css({opacity: 0});

        setTimeout(function()
        {
            if(!keepOverlay && !opts.overlay.keep)
                hideOverlay();
            
            box().remove();

            jQuery('.cb').removeClass('cb-active');

            var checkz = jQuery('.cb:last');
            jQuery('.cb').each(function()
            {
                if(checkz.css('zIndex') > jQuery(this).css('zIndex'))
                    checkz = jQuery(this);
            });
            checkz.addClass('cb-active');

            var del = doCallback('Killed');
            if(del) delete cb.vars.coolboxes[ID];

        }, (parseFloat(cb.helpers.getProperty(box(), 'duration')) * 1000));
    };

    /**
     * Load content from external source
     *
     * @param string html
     *
     * @return void
     */
    function loadContent(html)
    {
        jQuery.post(opts.href, opts.postvars, function(response)
        {
            html.find('.cb-inner').append(response);
            show(html);
        });
    };

    /**
     * Load an image and append to CoolBox
     *
     * @param string html
     *
     * @return void
     */
    function loadImage(html)
    {
        var img = new Image();
        img.onload = function()
        {
            var size = calculateNewDimensions(this);

            opts.width  = size[0];
            opts.height = size[1];

            html.addClass('cb-is-image');
            html.find('.cb-inner').append('<img class="cb-image" src="' + opts.href + '" alt="' + opts.title + '" width="' + size[0] + '" height="' + size[1] + '" />');
            show(html);
        };
        img.src = opts.href;
    };

    /**
     * Open CoolBox, load and initialize
     *
     * @return void
     */
    function open(h)
    {
        // --- show overlay, if enabled
        if(opts.overlay.enable)
            showOverlay();

        // --- setup html
        var html = jQuery('<div class="cb' + (opts['class'] ? ' ' + opts['class'] : '') + '" data-cb="' + ID + '"><div class="cb-inner"></div></div>');
        
        // --- load content
        if(opts.href)
        {
            //image
            if(cb.vars.isImage.test(opts.href))
                loadImage(html);

            //
            else
                loadContent(html);
        }

        // --- show empty box
        else
            show(html.find('.cb-inner').html(opts.content).parent());
    };

    /**
     * (Re)Position CoolBox
     *
     * @param int x
     * @param int y
     *
     * @return void
     */
    function position(x, y, scrollTop)
    {
        if(!x || x == 'center')
        {
            x = (jQuery('.cb-overlay').outerWidth() / 2);
            y = (jQuery('.cb-overlay').outerHeight() / 2);
        };

        opts.x = (x - (opts.width  / 2));
        opts.y = (y - (opts.height / 2)) + (scrollTop ? 0 : jQuery(window).scrollTop());

        box().css({top: opts.y, left: opts.x});
    };

    /**
     * Reisze CoolBox
     *
     * @param int    width
     * @param int    height
     *
     * @return void
     */
    function resize(w, h)
    {
        opts.width  = w;
        opts.height = h;

        box().css({width: w, height: h});
        position();
    };

    /**
     * Resize CoolBox to fit content
     *
     * @param string selector
     *
     * @return void
     */
    function resizeToFit(s)
    {
        if(s) s = box().find(s);
        else  s = jQuery(box().children()[0]);

        resize(s.outerWidth(), s.outerHeight());
    };

    /**
     * Complete setup and show CoolBox
     *
     * @param string html
     *
     * @return void
     */
    function show(html)
    {
        //
        doCallback('ContentLoaded');

        // --- title
        if(opts.title)
            html.find('.cb-inner').prepend('<div class="cb-title">' + opts.title + '</div>');

        // --- close btn
        if(opts.appendCloseBtn !== false)
        {
            html.find('.cb-inner').prepend('<a href="#" class="cb-close">' + (opts.appendCloseBtn !== true ? opts.appendCloseBtn : '')  + '</a>');
            html.find('.cb-close').bind('click', function(ev){ kill(); return ev.preventDefault(); });
        };

        // --- setup css
        html.css
        ({
            height : opts.height,
            opacity: 0,
            width  : (!cb.vars.isImage.test(opts.href) && opts.responsive.enabled && jQuery('.cb-overlay').outerWidth() < opts.responsive.enabled ? opts.responsive.width :  opts.width),
            zIndex : (++cb.vars.initialZIndex)
        });


        // --- fixed
        if(opts.fixed)
            html.css({position: 'fixed'});

        // --- append
        jQuery('body').append(html);

        // --- position
        position(opts.x, opts.y, opts.fixed);

        //
        setTimeout(function()
        {
            box().css({opacity: 1});
            jQuery('.cb-loader').css({opacity: 0, zIndex: -1});

            jQuery('.cb').removeClass('cb-active');
            box().addClass('cb-active');

            doCallback('Complete');

        }, (parseFloat(cb.helpers.getProperty(box(), 'duration')) * 1000));
    };

    /**
     * Show overlay
     *
     * @return void
     */
    function showOverlay()
    {
        jQuery('.cb-overlay').css({zIndex: cb.vars.initialZIndex, opacity: opts.overlay.opacity, background: opts.overlay.color});
        jQuery('.cb-overlay').bind('click', function(){ kill(); });

        if(opts.loader)
            jQuery('.cb-loader').css({zIndex: cb.vars.initialZIndex, opacity: opts.overlay.opacity});
    };

    /**
     *
     *
     */
    function walk(direction)
    {
        if(opts.group)
        {
            var found = false;
            var prev;

            jQuery('[data-group="' + opts.group + '"]').each(function(i)
            {
                if(found)
                {
                    kill(true);
                    jQuery(this).click();
                    return false;
                };

                if(direction == 'next' && jQuery(this).data('cb') == ID)
                {
                    found = true;

                    if(i >= (jQuery('[data-group="' + opts.group + '"]').length - 1))
                        doAction('EndOfGroup');
                }
                else if(direction == 'prev' && i != 0 && jQuery(this).data('cb') == ID)
                {
                    kill(true);
                    prev.click();
                    return false;
                };

                prev = jQuery(this);
            });
        };

        return false;
    };
    function next(){ walk('next'); };
    function previous(){ walk('prev'); };

    // --- return
    var ret = {
        box        : box,
        isActive   : isActive,
        kill       : kill,
        next       : next,
        open       : open,
        position   : position,
        previous   : previous,
        resize     : resize,
        resizeToFit: resizeToFit,
        getDefaults: function(){ return defaults; }
    };

    /**
     * ID
     * @const int
     */
    if(element)
        var ID = element.data('cb');
    else
    {
        var ID = cb.helpers.randStr();
        cb.vars.coolboxes[ID] = ret;
    };

    //
    return ret;
};


/* PLUGIN */
(function($)
{
    /**
     * Call CoolBox method
     * 
     * @param object element
     * @param sting  method
     * @param mixed  param
     *
     * @return void
     */
    var callMethod = function(e, method, param)
    {
        c = cb.vars.coolboxes[e.data('cb')];
        
        c[method](param);
    };

    // --- plugin
    $.fn.CoolBox = function(m, o)
    {
        if(typeof m == 'object')
            o = m;
        else if(!o)
            o = {};

        e = this;
        var s = e.selector;
        
        // --- methods
        switch(m)
        {
            case 'kill':
                callMethod(e, m, o);
                return e;
                break;
            case 'open':
                callMethod(e, m, o);
                return e;
                break;
        };
        
        // --- return
        return this.each(function()
        {
            if(!$(this).prop('data-cb'))
            {
                var id = cb.helpers.randStr();
                $(this).attr('data-cb', id);

                // --- bind click
                $(this).bind('click', function(ev)
                {
                    o.href  = (typeof $(this).prop('href')  != 'undefined' && !/^(\#)/.test($(this).attr('href')) ? $(this).attr('href') : false);
                    o.group = (typeof $(this).data('group') != 'undefined' ? $(this).data('group') : false);
                    o.title = (typeof $(this).prop('title') != 'undefined' ? $(this).prop('title') : false);
                    
                    // --- set url options
                    if((o.href && o.href.indexOf('?') != -1) || $(this).attr('href').indexOf('?') != -1)
                    {
                        var url = $(this).attr('href').split('?');
                        var url = url[1].split('&');

                        for(u in url)
                        {
                            var data = url[u].split('=');
                            o[data[0]] = data[1];
                        };
                    };

                    cb.vars.coolboxes[id] = new CoolBox(o, $(this));
                    cb.vars.coolboxes[id].open();

                    return ev.preventDefault();
                });
            };
        });
    };
})(jQuery);