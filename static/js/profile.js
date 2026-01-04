// Profile JavaScript

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProfile();
    setupProfileForm();
    updateProfileHeader();
});

// Update profile header with user name
function updateProfileHeader() {
    const userName = document.getElementById('user-name')?.textContent || 'User';
    const profileDisplayName = document.getElementById('profile-display-name');
    if (profileDisplayName) {
        profileDisplayName.textContent = userName;
    }
}

// Load profile data
async function loadProfile() {
    try {
        const response = await fetch('/api/profile');
        const profile = await response.json();

        document.getElementById('profile-about').value = profile.about || '';
        document.getElementById('profile-company').value = profile.company || '';
        document.getElementById('profile-vision-year').value = profile.vision_year || '';
        document.getElementById('profile-vision-month').value = profile.vision_month || '';
    } catch (error) {
        console.error('Error loading profile:', error);
        showStatus('Error loading profile. Please try again.', 'danger');
    }
}

// Setup profile form
function setupProfileForm() {
    const form = document.getElementById('profileForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            about: document.getElementById('profile-about').value.trim(),
            company: document.getElementById('profile-company').value.trim(),
            vision_year: document.getElementById('profile-vision-year').value.trim(),
            vision_month: document.getElementById('profile-vision-month').value.trim()
        };

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                showStatus('Profile updated successfully!', 'success');
            } else {
                showStatus('Error: ' + result.message, 'danger');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showStatus('Error saving profile. Please try again.', 'danger');
        }
    });
}

// Show status message
function showStatus(message, type) {
    const statusDiv = document.getElementById('profile-status');
    statusDiv.textContent = message;
    statusDiv.className = 'budget-status ' + type;
    statusDiv.style.display = 'block';

    // Hide after 3 seconds
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

