//单次加载的个数
var MAX = 10;

//动画默认的时长
var ANIMATE_DEFAULT_TIME = 300;

//默认请求网络等待时长
var NET_TIMEOUT = 5000;

//距离底部{@LOAD_OFFSET}时加载更多
var LOAD_OFFSET = 50;

var FIRST_Z_INDEX = 2000;

var SECOND_Z_INDEX = 1500;

var THIRD_Z_INDEX = 1300;

var FOUR_Z_INDEX = 1200;

var FIFTH_Z_INDEX = 1000;

//接口的当前页数
var pageIndex = 1;

//未加载完成的个数
var unloadedCount = 0;

//未加载完成的图片的队列
var unloadedArray = new Array();

var firstPage = $("#first-page");

var secondPage = $("#second-page");

var navi = $("#navi");

var centerLoading = $("#center-loading");

var headLoading = $("#head-loading");

var curDocument = $(document); 

var mBody = $("body");

//窗口宽度
var windowWidth = parseInt($(window).width());

//窗口高度
var windowHeight = parseInt($(window).height());

//默认字体大小，即1rem = ?px
var fontSize = parseInt($("html").css("font-size"));

//是否正在加载
var loading = false;

//记录第一页的滚动条位置
var firstPageScrollTop;

//瀑布流左侧的高度
var leftHeight = 0;

//瀑布流右侧的高度
var rightHeight = 0;

//每个图片的间距
var itemMargin = windowWidth * 0.015;

//一张图片的宽度
var itemWidth = (windowWidth - 3 * itemMargin) / 2;

//头部的高度
var headerHeight = $("#header").height();

//页面默认与顶部有一定间距
var pagePaddingTop = parseInt($(".page").css("padding-top"));/*headerHeight + toggleToPx(0.05);*/

//瀑布流左侧item的left属性
var leftItemStartLeft = itemMargin;

//瀑布流左侧item的top属性
var leftItemStartTop = pagePaddingTop;

//瀑布流右侧item的left属性
var rightItemStartLeft = itemMargin * 2 + itemWidth;

//瀑布流右侧item的top属性
var rightItemStartTop = pagePaddingTop;

//是否处于图片放大状态
var isBiggest = false;

var isFirstPage = true;

//Toast在显示中
var toastShowing = false;

//获取Toast组件
var toast = $("#toast");

//获取Toast组件的消息控件
var toastMsg = $("#toast-msg");

var TOAST_DEFAULT_COLOR = "#212121";

var TOAST_SUCCESS_COLOR = "#4CAF50";

var TOAST_WRONG_COLOR = "#D32F2F";

//保存Toast的推迟事件的ID
var toastAction;

//默认下Toast的维持时间
var TOAST_HOLD_TIME = 1000;

//Toast弹出时
var toastInTop = headerHeight;

//Toast消失时
var toastOutTop = 0;

//当前被选中的图片
var currentImg;

//被放大的图片
var globalImg;

//因为引用了toucher.js这个库
var containerTouch = util.toucher(mBody[0]);

//当文档加载完成，入口方法
$(function(){
    addLoadMoreListener();
    loadMoreImage();
    addClickListener();
});

//添加底部自动刷新
function addLoadMoreListener(){
   $(window).scroll(function(){
       if(isFirstPage && 
        !isBiggest && 
        !loading && 
        curDocument.scrollTop() + windowHeight + LOAD_OFFSET >= curDocument.height()){
            headLoading.fadeIn();
            loadMoreImage();
       }
   });
}

// function isCompatible(){
//     if(windowHeight / windowWidth < 1.5)
//         showToast("本WebApp可能尚未适配您的屏幕尺寸",TOAST_WRONG_COLOR);
// }

function addClickListener(){
    containerTouch.on("doubleTap",".image-item",function(e){
        // showToast("doubleTap");
        if(!isBiggest){
            currentImg = $(e.target);
            showBiggestImg(currentImg);
        }
    })
    .on("singleTap",".image-item",function(e){
        if(!isBiggest && isFirstPage){
            currentImg = $(e.target);
            firstToSecondPage();
        }  
    })
    .on("singleTap",".image-item-big",function(e){
        toggleSmallestImg(currentImg,globalImg);
    });

    navi.click(function(e){
        if(!isFirstPage)
            secondToFirstPage();
        else
            window.open("https://github.com/Sausure/GankWebApp");
    });
}

function loadMoreImage(){
    loading = true;
    unloadedCount = 0;
    unloadedArray.length = 0;

    $.ajax({
        url: "http://gank.avosapps.com/api/data/福利/"+ MAX + "/" + pageIndex,
        type: "get",
        timeout: NET_TIMEOUT,

        success: function (data) {
            if(data.error == true){
                loading = false;
                showToast("未知错误",TOAST_WRONG_COLOR);
                return;
            }

            if(data.results.length == 0){
                showToast("以上是全部内容");
                loading = false;
                return;
            }
            
            onLoadMoreSuccess(data);
        },
        error: function () {
            loading = false;
            showToast("网络错误",TOAST_WRONG_COLOR);
        }
    });
}

function onLoadMoreSuccess(data){
    var length = data.results.length;
    unloadedCount = length;

    for(var i = 0;i < length;++i)
    {
        var publishedAt = data.results[i].publishedAt.substr(0,10).replace(/-/g,"/");

        var img = new Image();
        img.src = data.results[i].url;
        unloadedArray[i] = generateObject(publishedAt,img); 

        if(img.complete) {
            reduceUnloadedCount();
            continue;
        }

        img.onload = function() {
            this.onload = null;
            reduceUnloadedCount();
        };

        img.onerror = function(){
            this.onerror = null;
            reduceUnloadedCount();
        }
    }
}

function generateObject(publishedAt,img){
    var object = new Object();

    object.publishedAt = publishedAt;
    object.img = img;

    return object;
}

function reduceUnloadedCount(){
    --unloadedCount;

    if(unloadedCount == 0)
        onImageLoadedAll();
}

function onImageLoadedAll(){
    var successCount = 0;

    for(var i = 0;i < unloadedArray.length;++i){
        var img = unloadedArray[i].img;
        if(img.complete){
            onImageListItemShow(unloadedArray[i]);
            ++successCount;
        }
    }

    loading = false;
    centerLoading.fadeOut();
    headLoading.fadeOut();
    firstPage.fadeIn();
    var msg = "来"+successCount+"份妹子";
    showToast(pageIndex == 1 ? msg : "再" + msg,TOAST_SUCCESS_COLOR);
    pageIndex += 1;
}

function onImageListItemShow(object){
    var img = object.img;
    var originalWidth = img.width;
    var originalHeight = img.height;
    var currentHeight;
    var currentTop;
    var currentLeft;
    // console.log(originalWidth+","+originalHeight+","+originalHeight/originalWidth);
    currentHeight = itemWidth / originalWidth * originalHeight;

    if(leftHeight <= rightHeight){
        currentTop = leftItemStartTop;
        currentLeft = leftItemStartLeft;
        leftHeight += currentHeight;
        leftItemStartTop += (currentHeight + itemMargin);
    }else{
        currentTop = rightItemStartTop;
        currentLeft = rightItemStartLeft;
        rightHeight += currentHeight;
        rightItemStartTop +=  (currentHeight + itemMargin);
    }
    
    // currentTop = toggleToRem(currentTop);
    // currentLeft = toggleToRem(currentLeft);
    // currentHeight = toggleToRem(currentHeight);

    var item = '<img src="'+img.src+'" class="image-item"'+
     'style="top:'+addPxSuffix(currentTop)+';left:'+addPxSuffix(currentLeft)+';'+
     'width:'+addPxSuffix(itemWidth)+';height:'+addPxSuffix(currentHeight)+';" ' +
     'alt="'+object.publishedAt+'" >';

    firstPage.append(item);
}

// var actionId;
// var MIN_Double_CLICK_TIME = 500;
// var dbClick = false;
// var firstClickItem;

// function onMouseDown(e,img){
//     var currentClickItem =$(img).attr("alt");
//     // alert("et");
//     // alert(e.propertyName);
//     if(!dbClick){
//         dbClick = true;
//         firstClickItem = currentClickItem;
//         actionId = setTimeout(function(){
//                 dbClick = false;/*alert("single");*/
//                 showToast("single");
//                 // loadDetail(currentClickItem);
//             },MIN_Double_CLICK_TIME);
//     }else if(currentClickItem == firstClickItem){
//         clearTimeout(actionId);
//         dbClick = false;/*alert("dbClick");*/
//         showToast("dbClick");
//         showBiggestImg(img);
//     }else{
//         clearTimeout(actionId);
//         dbClick = false;
//     }
//     e.preventDefault();
//     e.stopPropagation();
//     return false;
// }

function toggleSmallestImg(smallImg,bigImg){
    var originalWidth = smallImg.width();
    var originalHeight = smallImg.height();
    var originalTop = reduceScrollTop(parseInt(smallImg.css("top")));
    var originalLeft = parseInt(smallImg.css("left"));

    bigImg.animate({
        width: addPxSuffix(originalWidth),
        height: addPxSuffix(originalHeight),
        top: addPxSuffix(originalTop),
        left: addPxSuffix(originalLeft)
    },ANIMATE_DEFAULT_TIME,"swing",function(){
        globalImg.remove();
        window.scrollTo(0,firstPageScrollTop);
        $("#container").removeClass("blur");
        mBody.css("overflow-y","auto");
        isBiggest = false;
    });
}

function showBiggestImg(smallImg){
    isBiggest = true;

    var originalTop = reduceScrollTop(parseInt(smallImg.css("top")));

    globalImg = smallImg.clone().prependTo(mBody);

    var currentWidth = windowWidth;
    var currentHeight = currentWidth / globalImg.width()  * globalImg.height();
    var currentTop =  (windowHeight - currentHeight) / 2;
    var currentLeft = 0;

    globalImg.removeClass("image-item");
    globalImg.addClass("image-item-big");
    globalImg.css("z-index",FIRST_Z_INDEX);
    globalImg.css("top",addPxSuffix(originalTop));

    globalImg.animate({
        width: addPxSuffix(currentWidth),
        height: addPxSuffix(currentHeight),
        top:  addPxSuffix(currentTop),
        left:  addPxSuffix(currentLeft)
    },ANIMATE_DEFAULT_TIME,"swing",function(){
        $("#container").addClass("blur");
        firstPageScrollTop = curDocument.scrollTop();
        mBody.css("overflow-y","hidden");
    });
}

function addPxSuffix(item){
    return item + "px";
}

function reduceScrollTop(top){
    return top - curDocument.scrollTop();
}

function secondToFirstPage(){
    secondPage.fadeOut(ANIMATE_DEFAULT_TIME,function(){
        secondPage.empty();
    });


    firstPage.fadeIn(ANIMATE_DEFAULT_TIME,function(){
        window.scrollTo(0,firstPageScrollTop);
        $("#title-url").attr("href","http://gank.io/");
        isFirstPage = true;
        naviToGitHub();
    });
}

function naviToGitHub(){
    navi.attr("src","img/github.png");
}

function naviToFirst(){
    navi.attr("src","img/navi_back.png");
}

function firstToSecondPage(){
    isFirstPage = false;
    firstPageScrollTop = curDocument.scrollTop();

    firstPage.fadeOut(ANIMATE_DEFAULT_TIME,function(){
        var alt = currentImg.attr("alt");
        loadDetail(alt);
        $("#title-url").attr("href","http://gank.io/" + alt);
    });

    naviToFirst();
    centerLoading.fadeIn();
    headLoading.fadeIn();
}

function generateRelDate(date){
    var dateArr = date.substr(5,5).split("/");

    var month = removeZeroPrefix(dateArr[0]) + "月";

    var day = removeZeroPrefix(dateArr[1]) + "日";

    return month + day;
}

function removeZeroPrefix(d){
    return d.replace(/(0\d)/,function(d){
        return d.substr(1,1);
    });
}

function loadDetail(date){
    loading = true;
    
    var relDate = generateRelDate(date);
    
    $.ajax({
        url: "http://gank.avosapps.com/api/day/"+ date,
        type: "get",
        timeout: NET_TIMEOUT,

        success: function (data) {
            if(data.error == true){
                loading = false;
                showToast("未知错误",TOAST_WRONG_COLOR);
                return;
            }

            handleDetailData(data,relDate);
        },
        error: function () {
            loading = false;
            showToast("网络错误",TOAST_WRONG_COLOR);
        }
    });
}

function handleDetailData(data,relDate){
    var category = data.category;

    for(var i = 0;i < category.length;++i){
        var item = category[i];

        if(item == "福利")
            perpendImg(data.results[item][0]);
        else
            appendCategory(item,data);
    }

    loading = false;
    centerLoading.fadeOut();
    headLoading.fadeOut();
    secondPage.fadeIn(ANIMATE_DEFAULT_TIME,function(){
        window.scrollTo(0,0);
    });
    showToast(relDate,TOAST_SUCCESS_COLOR);
}

function appendCategory(item,data){
    var html = '<div class="category">';

    html += appendListTitle(item);
    html += appendList(data.results[item]);
    html += '</div>';

    secondPage.append(html);
}

function appendListTitle(title){
    return '<h class="category-title">'+title+'</h>';
}

function appendList(list){
    var html;

    html = '<ul class="category-list">';
    for(var i = 0;i < list.length;++i){
        var item = list[i];

        html += '<li><a target="_blank" href="'+item.url+'">'+item.desc+'</a>('+item.who+')</li>';
    }

    html += '</ul>';

    return html;
}

function perpendImg(img){
    secondPage.prepend('<div id="second-page-img-container"><img src="'+
        img.url+'" class="img-zoom"></div>');
}

// function toggleToRem(Px){
//     return Px / fontSize;
// }

function toggleToPx(Rem){
    return Rem * fontSize;
}

function showToast(msg,color){
    toast.css("background-color",color !=null ? color : "#212121");

    if(!toastShowing){
        toastShowing = true;
        toastMsg.html(msg);
        toast.animate({
            top:addPxSuffix(toastInTop)
        },ANIMATE_DEFAULT_TIME,"swing",function(){
            toastAction = setTimeout(hideToast,TOAST_HOLD_TIME);
        });
        
    }else{
        clearTimeout(toastAction);
        toastMsg.html(msg);
        toastAction = setTimeout(hideToast,TOAST_HOLD_TIME);
    }
}

function hideToast(){
    toastShowing = false;
    
    toast.animate({
        top:addPxSuffix(toastOutTop)
    },ANIMATE_DEFAULT_TIME,"swing",function(){
        toastMsg.html("");
    });
}