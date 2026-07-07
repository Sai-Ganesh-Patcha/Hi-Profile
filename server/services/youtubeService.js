const getYouTubeProfile = async (usernameOrChannelId) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error('YouTube API Key is not configured on the backend');
    }
    
    // 1. Fetch channel details
    let url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&key=${apiKey}`;
    if (usernameOrChannelId.startsWith('UC') && usernameOrChannelId.length === 24) {
        url += `&id=${usernameOrChannelId}`;
    } else {
        // Normalize handle (YouTube handles must start with @)
        const handle = usernameOrChannelId.startsWith('@') ? usernameOrChannelId : `@${usernameOrChannelId}`;
        url += `&forHandle=${encodeURIComponent(handle)}`;
    }
    
    const channelRes = await fetch(url);
    if (!channelRes.ok) {
        throw new Error(`YouTube channel API error (status ${channelRes.status})`);
    }
    const channelData = await channelRes.json();
    if (!channelData.items || channelData.items.length === 0) {
        throw new Error('YouTube channel not found');
    }
    
    const channel = channelData.items[0];
    const snippet = channel.snippet;
    const statistics = channel.statistics;
    const contentDetails = channel.contentDetails;
    
    // 2. Fetch latest 3 videos from the uploads playlist
    let videos = [];
    const uploadsPlaylistId = contentDetails?.relatedPlaylists?.uploads;
    if (uploadsPlaylistId) {
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=3&key=${apiKey}`;
        const playlistRes = await fetch(playlistUrl);
        if (playlistRes.ok) {
            const playlistData = await playlistRes.json();
            if (playlistData.items) {
                videos = playlistData.items.map(item => {
                    const videoSnippet = item.snippet;
                    const videoId = videoSnippet?.resourceId?.videoId;
                    return {
                        title: videoSnippet?.title || '',
                        thumbnailUrl: videoSnippet?.thumbnails?.high?.url || videoSnippet?.thumbnails?.medium?.url || videoSnippet?.thumbnails?.default?.url || '',
                        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''
                    };
                });
            }
        }
    }
    
    return {
        profilePicture: snippet?.thumbnails?.high?.url || snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url || '',
        channelName: snippet?.title || '',
        handle: snippet?.customUrl || usernameOrChannelId,
        description: snippet?.description || '',
        subscribersCount: statistics?.subscriberCount ? parseInt(statistics.subscriberCount) : 0,
        videoCount: statistics?.videoCount ? parseInt(statistics.videoCount) : 0,
        viewCount: statistics?.viewCount ? parseInt(statistics.viewCount) : 0,
        recentVideos: videos
    };
};

module.exports = { getYouTubeProfile };
