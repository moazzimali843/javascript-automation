document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start-automation");
  const jobTitleInput = document.getElementById("jobTitle");
  const locationInput = document.getElementById("location");

  // Check automation status on popup open
  chrome.storage?.local.get("isAutomating", (data) => {
    if (data.isAutomating) {
      startButton.textContent = "Stop Automation";
      startButton.classList.add("stopping");
      jobTitleInput.disabled = true;
      locationInput.disabled = true;
    }
  });

  startButton.addEventListener("click", async () => {
    const jobTitle = jobTitleInput.value.trim();
    const location = locationInput.value.trim();

    if (startButton.classList.contains("stopping")) {
      // Stop automation
      chrome.storage.local.set({ isAutomating: false });
      chrome.runtime.sendMessage({ action: "stop_automation" });
      startButton.textContent = "Start Automation";
      startButton.classList.remove("stopping");
      jobTitleInput.disabled = false;
      locationInput.disabled = false;
      return;
    }

    alert(`Job title is: ${jobTitle} and location is: ${location}`);

    if (!jobTitle || !location) {
      alert("Please fill in both job title and location");
      return;
    }

    // Start automation
    chrome.storage.local.set({ isAutomating: true });
    startButton.textContent = "Stop Automation";
    startButton.classList.add("stopping");
    jobTitleInput.disabled = true;
    locationInput.disabled = true;

    const indeedURL = `https://www.indeed.com/jobs?q=${encodeURIComponent(jobTitle)}&l=${encodeURIComponent(location)}`;

    // Send job title and location to the backend
    const jobLinks = [ "https://pk.indeed.com/rc/clk?jk=3fb0b045840dd388&bb=K2qoxIfpmeHvvJsaH2BV3_litDMhqBUEPi30MnlzTmwZZCgqS4wd8byfwYlHxYfLmY0xLmPnvOjR9WNzurrpAjui13UWVMs2ZIr06cP_xOuuvyqVcimWb5_sMotFnPNS&xkcb=SoD667M35lOusSzmx50ObzkdCdPP&fccid=39b6e51eea365e6e&cmp=TechBucks&ti=Junior+Developer&vjs=3",
"https://pk.indeed.com/rc/clk?jk=bd50fbc4f98496ae&bb=K2qoxIfpmeHvvJsaH2BV35q-UHIp1B5Y3xc3yZXP6y0YVW3cnt2uFovwzW39kZOq2sNZ_2eYKZCBK9_bLfiELVeJT2iHRaDDtNKBUs_IJDq2y2KpGi4mdtbR5l8L2It9&xkcb=SoA667M35lOusSzmx50DbzkdCdPP&fccid=4b291d20a7ed1770&cmp=Sky-IT-Services&ti=Front+End+Developer&vjs=3"
 ];
    chrome.runtime.sendMessage({
      action: "open_tab",
      data: { jobLinks },
    });

    //   fetch('https://d467-103-115-198-72.ngrok-free.app/application_process', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({ jobTitle, location })
    // })
    //   .then(response => response.json())
    //   .then(data => {
    //     console.log("data: ", data)
    //     const jobLinks = data.jobLinks;
    //     alert(`jobLink ${jobLinks}`);
    //     console.log("jobLink: ", jobLinks)
    //     // Send the job link to the background script
    //     chrome.runtime.sendMessage({
    //       action: 'open_tab',
    //       data: { jobLinks }
    //     });
      })
      .catch(error => {
        console.error('Error fetching job link:', error);
      });
  });
// });
