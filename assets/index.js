/**
 * Created by xiayongfeng on 2015/3/18.
 */
$(function () {

    function getPostsByFeed(feedID) {
        var postListReq = $.ajax({
            type: 'get',
            url: '/feed/' + feedID,
            dataType: 'json'
        });
        postListReq.done(function (resp) {
            if (resp.code === 1000) {
                resp.data.forEach(function (ele, index, arr) {
                    resp.data[index].is_star = parseInt(ele.is_star);
                    resp.data[index].is_read = parseInt(ele.is_read);
                });
                if (feedID === feedListVM.activeFeed.feed_id) {
                    postListVM.posts = resp.data;
                }
            } else {
                alertify.log(resp.message, 'error', 5000);
            }
        });
    }

    function activeFeed(targetFeedID) {
        feedListVM.feeds.forEach(function (element, index, arr) {
            if (element.feed_id == targetFeedID) {
                feedListVM.feeds[index].active = true;
                feedListVM.activeFeed = element;
            } else {
                if (element.active === true) {
                    feedListVM.feeds[index].active = false;
                }
            }
        });
    }

    /*
     * 取用户信息
     * */

    var userProfileVM = new Vue({
        el: '#for_user_profile',
        data: {
            user_name: ''
        },
        methods: {
            onClick: function (e) {
                $('#new_feed_modal').modal('show');
            }
        }
    });

    var userProfileReq = $.ajax({
        type: 'get',
        url: '/user/profile',
        dataType: 'json'
    });
    userProfileReq.done(function (resp) {
        if (resp.code === 1000) {
            userProfileVM.user_name = resp.data.name_from;
        } else {
            alertify.log(resp.message, 'error', 5000);
        }
    });

    /*
     * 取订阅列表
     * */

    var feedListVM = new Vue({
        el: '#feed_list',
        data: {
            feeds: [],
            activeFeed: null
        },
        methods: {
            listMyPost: function (targetFeed, e) {
                e.stopPropagation();
                getPostsByFeed(targetFeed.feed.feed_id);
                activeFeed(targetFeed.feed.feed_id);
            },
            unsubscribeIt: function (targetFeed, e) {
                e.stopPropagation();
                var unsubscribeReq = $.ajax({
                    type: 'post',
                    url: '/feed/unsubscribe',
                    data: {
                        feed_id: targetFeed.feed.feed_id
                    },
                    dataType: 'json'
                });
                unsubscribeReq.done(function (resp) {
                    if (resp.code === 1000) {
                        alertify.log('成功！', 'success', 1000);
                        setTimeout("window.location.href='/'", 1500);
                    } else {
                        alertify.log(resp.message, 'error', 5000);
                    }
                });
            },
            updateFeed: function(targetFeed, e) {
                e.stopPropagation();

                targetFeed.feed.updating = true;
                var targetFeedID = targetFeed.feed.feed_id;
                var updateFeedReq = $.ajax({
                    type: 'post',
                    url: '/feed/' + targetFeedID + '/update',
                    data: {},
                    dataType: 'json'
                });
                updateFeedReq.done(function(resp) {
                    if (resp.code === 1000) {
                        targetFeed.feed.unread_count = resp.data.unread_count;
                        if (feedListVM.activeFeed.feed_id === targetFeedID) {
                            getPostsByFeed(targetFeedID);
                        }
                    } else {
                        alertify.log(resp.message, 'error', 5000);
                    }
                    targetFeed.feed.updating = false;
                });
            }
        }
    });

    var feedListReq = $.ajax({
        type: 'get',
        url: '/feed',
        dataType: 'json'
    });
    feedListReq.done(function (resp) {
        if (resp.code === 1000) {
            resp.data.forEach(function (ele, index, arr) {
                resp.data[index].active = false;
                resp.data[index].unread_count = parseInt(ele.unread_count);
                resp.data[index].updating = false;
            });
            feedListVM.feeds = resp.data;
            if (feedListVM.feeds.length) {
                getPostsByFeed(feedListVM.feeds[0].feed_id);
                activeFeed(feedListVM.feeds[0].feed_id);
            }
        } else {
            alertify.log(resp.message, 'error', 5000);
        }
    });

    var postListVM = new Vue({
        el: '#post_list',
        data: {
            posts: []
        },
        methods: {
            starOrNot: function (targetPost, e) {
                e.stopPropagation();

                var targetPostID = targetPost.post.post_id,
                    setStar = targetPost.post.is_star === 0 ? 1 : 0;
                var starPostReq = $.ajax({
                    type: 'post',
                    url: '/feed/' + feedListVM.activeFeed.feed_id + '/post/' + targetPostID,
                    data: {
                        set_star: setStar
                    },
                    dataType: 'json'
                });
                starPostReq.done(function (resp) {
                    if (resp.code === 1000) {
                        targetPost.post.is_star = setStar;
                    } else {
                        alertify.log(resp.message, 'error', 5000);
                    }
                });
            },
            readOrNot: function (targetPost, e) {
                e.stopPropagation();

                var targetPostID = targetPost.post.post_id,
                    setRead = targetPost.post.is_read === 0 ? 1 : 0;
                var readPostReq = $.ajax({
                    type: 'post',
                    url: '/feed/' + feedListVM.activeFeed.feed_id + '/post/' + targetPostID,
                    data: {
                        set_read: setRead
                    },
                    dataType: 'json'
                });
                readPostReq.done(function (resp) {
                    if (resp.code === 1000) {
                        targetPost.post.is_read = setRead;
                        feedListVM.activeFeed.unread_count += (setRead === 1 ? -1 : 1);
                    } else {
                        alertify.log(resp.message, 'error', 5000);
                    }
                });
            },
            toStopPropagation: function(e) {
                e.stopPropagation();
            }
        }
    });

    var newFeedModal = new Vue({
        el: '#new_feed_modal',
        data: {
            feed_url: ""
        },
        methods: {
            addNewFeed: function (e) {
                var thatViewModel = e.targetVM;
                var req = $.ajax({
                    type: 'post',
                    url: '/feed/subscribe',
                    data: {
                        url: thatViewModel.feed_url
                    },
                    dataType: 'json'
                });
                req.done(function (resp) {
                    if (resp.code === 1000) {
                        $('#new_feed_modal').modal('hide');
                        alertify.log('成功！', 'success', 1000);
                        setTimeout("window.location.href='/'", 1500);
                    } else {
                        alertify.log(resp.message, 'error', 5000);
                    }
                });
            }
        }
    });
});