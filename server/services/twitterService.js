const getTwitterProfile = async (username) => {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    // If bearer token is provided, we can fetch
    if (bearerToken) {
        try {
            const res = await fetch(`https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url,description,public_metrics`, {
                headers: {
                    'Authorization': `Bearer ${bearerToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    const user = data.data;
                    return {
                        success: true,
                        username: user.username,
                        displayName: user.name,
                        bio: user.description || '',
                        profilePicture: user.profile_image_url || '',
                        followersCount: user.public_metrics?.followers_count || 0,
                        followingCount: user.public_metrics?.following_count || 0,
                        postCount: user.public_metrics?.tweet_count || 0,
                        recentPosts: []
                    };
                }
            }
        } catch (e) {
            console.error('Twitter API error:', e.message);
        }
    }
    
    // Fallback: indicate API is unavailable, but return username and profile url so the frontend can still display the handle and link
    return {
        success: false,
        errorType: 'UNAVAILABLE',
        username: username,
        profileUrl: `https://x.com/${username}`
    };
};

module.exports = { getTwitterProfile };
