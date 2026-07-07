const getGitHubProfile = async (username) => {
    const token = process.env.GITHUB_TOKEN;
    const headers = {
        'User-Agent': 'HighProfile-App'
    };
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }
    
    // Fetch profile
    const profileRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!profileRes.ok) {
        throw new Error(`GitHub user not found (status ${profileRes.status})`);
    }
    const profile = await profileRes.json();
    
    // Fetch repos
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=3`, { headers });
    let repos = [];
    if (reposRes.ok) {
        const reposData = await reposRes.json();
        repos = reposData.map(repo => ({
            name: repo.name,
            description: repo.description || '',
            stars: repo.stargazers_count,
            language: repo.language || '',
            url: repo.html_url
        }));
    }
    
    return {
        avatarUrl: profile.avatar_url || '',
        username: profile.login || username,
        name: profile.name || profile.login || username,
        bio: profile.bio || '',
        followersCount: profile.followers || 0,
        followingCount: profile.following || 0,
        reposCount: profile.public_repos || 0,
        recentRepos: repos
    };
};

module.exports = { getGitHubProfile };
