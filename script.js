document.addEventListener("DOMContentLoaded", function () {
    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const easyProgressCircle = document.querySelector(".easy-progress");
    const mediumProgressCircle = document.querySelector(".medium-progress");
    const hardProgressCircle = document.querySelector(".hard-progress");
    const cardStatsContainer = document.querySelector(".stats-cards");
    const para = document.querySelector(".header .para");
    const inputBox = document.querySelector(".user-container");
    const user = document.querySelector(".userProfile");
    const information = document.querySelector(".userInformation");

    function validateUsername(username) {
        if (username.trim() === "") {
            alert("Username should not be empty");
            return false;
        }
        const regex = /^[a-zA-Z0-9-]{1,15}$/;
        const isMatching = regex.test(username);
        if(!isMatching) {
            alert("Invalid Username");
        }
        return isMatching;
    }

    async function fetchUserDetails(username) {
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;

    
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const targetUrl = 'https://leetcode.com/graphql/';
    
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
    
            const profile = JSON.stringify({
                query: "\n    query userPublicProfile($username: String!) {\n  matchedUser(username: $username) {\n    contestBadge {\n      name\n      expired\n      hoverText\n      icon\n    }\n    username\n    githubUrl\n    twitterUrl\n    linkedinUrl\n    profile {\n      ranking\n      userAvatar\n      realName\n      aboutMe\n      school\n      websites\n      countryName\n      company\n      jobTitle\n      skillTags\n      postViewCount\n      postViewCountDiff\n      reputation\n      reputationDiff\n      solutionCount\n      solutionCountDiff\n      categoryDiscussCount\n      categoryDiscussCountDiff\n      certificationLevel\n    }\n  }\n}\n    ",
                variables: {username: username}
            })

            const graphql = JSON.stringify({
                query: `query userProfileUserQuestionProgressV2($userSlug: String!) {
                    userProfileUserQuestionProgressV2(userSlug: $userSlug) {
                        numAcceptedQuestions { count difficulty }
                        numFailedQuestions { count difficulty }
                        numUntouchedQuestions { count difficulty }
                        userSessionBeatsPercentage { difficulty percentage }
                        totalQuestionBeatsPercentage
                    }
                }`,
                variables: { userSlug: username }
            });
    
            const badges = JSON.stringify({
                query: `query userBadges($username: String!) {
                    matchedUser(username: $username) {
                        badges {
                            id name shortName displayName icon hoverText 
                            medal { slug config { iconGif iconGifBackground } }
                            creationDate category
                        }
                        upcomingBadges { name icon progress }
                    }
                }`,
                variables: { username }
            });

            const requestOptionsProfile = {method: "POST", headers: myHeaders, body: profile, redirect: "follow"};
            const requestOptions = { method: "POST", headers: myHeaders, body: graphql, redirect: "follow" };
            const requestOptions1 = { method: "POST", headers: myHeaders, body: badges, redirect: "follow" };
    
            // Wait for both responses
            const [response, response1, response2] = await Promise.all([
                fetch(proxyUrl + targetUrl, requestOptions),
                fetch(proxyUrl + targetUrl, requestOptions1),
                fetch(proxyUrl + targetUrl, requestOptionsProfile)
            ]);
    
            // Check for errors in responses
            if (!response.ok) {
                throw new Error("Failed to fetch user stats: " + response.statusText);
            }
            if (!response1.ok) {
                throw new Error("Failed to fetch badge data: " + response1.statusText);
            }
    
            // Parse JSON responses
            const parsedData = await response.json();
            const parsedData1 = await response1.json();
            const parseProfile = await response2.json();
    
            // Debugging: Log API responses
            console.log("User Stats Data:", parsedData);
            console.log("Badges Data:", parsedData1);
            console.log("Profile Data:",parseProfile);
    
            // Call display function with both responses
            displayUserData(parsedData, parsedData1,parseProfile);
        } catch (error) {
            statsContainer.innerHTML = `<p>No data found</p>`;
            console.error(error);
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
            inputBox.style.display="none";
        }
    }
    

    function updateProgress(solved,total,label,circle){
        const progressDegree = (solved/total)*100;
        circle.style.setProperty("--progress-degree",`${progressDegree}%`);
        label.textContent = `${solved}/${total}`;
    }
    function displayUserData(parsedData, parsedData1, parseProfile) {
        if (!parsedData || !parsedData.data) {
            console.error("Error: parsedData is undefined or invalid");
            return;
        }
        if (!parsedData1 || !parsedData1.data || !parsedData1.data.matchedUser) {
            console.error("Error: parsedData1 is undefined or invalid");
            return;
        }
        if (!parseProfile || !parseProfile.data || !parseProfile.data.matchedUser) {
            console.error("Error: parseProfile is undefined or invalid");
            return;
        }
    
    
        console.log("Processing user stats...");
        const realName = parseProfile.data.matchedUser?.profile?.realName || "User";

        // Adding it to the page
        const para = document.querySelector(".header .para");
        let profileName = document.createElement("h4");
        profileName.textContent = realName;
        para.innerHTML += ` - <span class="real-name">${realName}</span>`;

        //adding user profile 
        const userProfile = parseProfile.data.matchedUser?.profile?.userAvatar || "default-avatar.png";
        user.innerHTML = `<img src="${userProfile}" alt="User Avatar" />`;
        user.style.cssText = "border-radius:50%";

        //adding user information 
        const username = parseProfile.data.matchedUser?.username|| "username";
        const userRanking = parseProfile.data.matchedUser?.profile?.ranking|| "0";
        const userCountry = parseProfile.data.matchedUser?.profile?.countryName|| "None";
        information.innerHTML = `<h4><span>Username:</span> <span>${username}</span></h4>
    <h4><span>User Ranking:</span> <span>${userRanking}</span></h4>
    <h4><span>User Country:</span> <span>${userCountry}</span></h4>`;

        // Extract question progress
        const totalEasyQuestions = parsedData.data.userProfileUserQuestionProgressV2.numAcceptedQuestions.find(q => q.difficulty === "EASY")?.count || 0;
        const totalMediumQuestions = parsedData.data.userProfileUserQuestionProgressV2.numAcceptedQuestions.find(q => q.difficulty === "MEDIUM")?.count || 0;
        const totalHardQuestions = parsedData.data.userProfileUserQuestionProgressV2.numAcceptedQuestions.find(q => q.difficulty === "HARD")?.count || 0;
    
        updateProgress(totalEasyQuestions, 856, easyLabel, easyProgressCircle);
        updateProgress(totalMediumQuestions, 1793, mediumLabel, mediumProgressCircle);
        updateProgress(totalHardQuestions, 796, hardLabel, hardProgressCircle);
    
        console.log("Processing badges...");
        
        const badgesArray = parsedData1.data.matchedUser.badges.map(badge => ({
            name: badge.displayName,
            iconGif: badge.medal.config.iconGif,
            backgroundImg: badge.medal.config.iconGifBackground
        }));
    
        cardStatsContainer.innerHTML = badgesArray.map(data => {
            return `
                <div class="card">
                    <h3>${data.name}</h3>
                    <div class="badge-container" style="background-image: url('${data.backgroundImg}');">
                        <img src="${data.iconGif}" alt="${data.name}" />
                    </div>
                </div>
            `;
        }).join("");    
    }
    

    searchButton.addEventListener("click", function () {
        const username = usernameInput.value.trim();
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });
});
