document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let hideMessageTimeout = null;

  function displayMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    if (hideMessageTimeout) {
      clearTimeout(hideMessageTimeout);
    }

    hideMessageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        if (details.participants.length) {
          const participantsSection = document.createElement("div");
          participantsSection.className = "participants-section";

          const participantsLabel = document.createElement("p");
          participantsLabel.innerHTML = "<strong>Participants:</strong>";

          const participantsList = document.createElement("ul");

          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const participantName = document.createElement("span");
            participantName.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-delete";
            removeButton.dataset.activity = name;
            removeButton.dataset.participant = participant;
            removeButton.title = `Remove ${participant}`;
            removeButton.textContent = "✕";

            participantItem.append(participantName, removeButton);
            participantsList.appendChild(participantItem);
          });

          participantsSection.append(participantsLabel, participantsList);
          activityCard.appendChild(participantsSection);
        } else {
          const noParticipants = document.createElement("p");
          noParticipants.className = "no-participants";
          noParticipants.textContent = "Participants: None yet";
          activityCard.appendChild(noParticipants);
        }

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function removeParticipant(activity, participant) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(participant)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        displayMessage(result.message, "success");
        fetchActivities();
      } else {
        displayMessage(result.detail || "Unable to remove participant", "error");
      }
    } catch (error) {
      displayMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  }

  activitiesList.addEventListener("click", (event) => {
    const button = event.target.closest(".participant-delete");
    if (!button) return;

    const activity = button.dataset.activity;
    const participant = button.dataset.participant;

    if (activity && participant) {
      removeParticipant(activity, participant);
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
        await fetchActivities();
        displayMessage(result.message, "success");
      } else {
        displayMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      displayMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
