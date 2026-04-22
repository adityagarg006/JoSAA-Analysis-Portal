import time
import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def js_select(driver, element_id, option_text):
    """
    Finds a dropdown, uses JavaScript to forcefully select an option by text,
    and triggers the website's internal update event.
    """
    wait = WebDriverWait(driver, 20)
    # Wait for the dropdown to exist in the HTML (not necessarily be clickable)
    wait.until(EC.presence_of_element_located((By.ID, element_id)))
    
    script = f"""
        var select = document.getElementById('{element_id}');
        for (var i = 0; i < select.options.length; i++) {{
            if (select.options[i].text.includes('{option_text}')) {{
                select.selectedIndex = i;
                select.dispatchEvent(new Event('change'));
                return true;
            }}
        }}
        return false;
    """
    success = driver.execute_script(script)
    
    if not success:
        print(f" Warning: Could not find '{option_text}' in {element_id}")
    
    # Hard pause to let the ASP.NET server process the request and reload the DOM
    time.sleep(3)
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")


def js_click(driver, element_id):
    """Forcefully clicks an element using JavaScript to bypass overlays."""
    wait = WebDriverWait(driver, 20)
    element = wait.until(EC.presence_of_element_located((By.ID, element_id)))
    driver.execute_script("arguments[0].click();", element)
    time.sleep(3)


def scrape_iitg_josaa_2024(round=5, year=2024):
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(options=options)
    
    url = "https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx"
    
    print(f"Navigating to {url}...")
    driver.get(url)
    
    # Initial pause to let the base page establish itself
    time.sleep(2)

    try:
        # 1. Select Year 
        print(f"Selecting Year ({year})...")
        js_select(driver, "ctl00_ContentPlaceHolder1_ddlYear", str(year))

        # 2. Select Round
        print(f"Selecting Round ({round})...")
        js_select(driver, "ctl00_ContentPlaceHolder1_ddlroundno", str(round))

        # 3. Select Institute Type
        print("Selecting Institute Type...")
        js_select(driver, "ctl00_ContentPlaceHolder1_ddlInstype", "Indian Institute of Technology")

        # 4. Select Institute Name
        print("Selecting Institute Name...")
        js_select(driver, "ctl00_ContentPlaceHolder1_ddlInstitute", "ALL")

        # 5. Select Academic Program
        print("Selecting Academic Program...")
        js_select(driver, "ctl00_ContentPlaceHolder1_ddlBranch", "ALL")

        # 6. Select Seat Type 
        print("Selecting Seat Type...")
        js_select(driver, "ctl00_ContentPlaceHolder1_ddlSeatType", "ALL")

        # 7. Submit (Using JS Click to bypass the same overlay issue)
        print("Submitting the form...")
        js_click(driver, "ctl00_ContentPlaceHolder1_btnSubmit")
        
        # 8. Wait for Results Table
        print("Waiting for data table to load...")
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.ID, "ctl00_ContentPlaceHolder1_GridView1"))
        )
        
        # 9. Parse HTML and Save to CSV
        print("Parsing table and saving to CSV...")
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        table = soup.find('table', {'id': 'ctl00_ContentPlaceHolder1_GridView1'})
        
        df = pd.read_html(str(table))[0]
        csv_filename = f"JoSAA_{year}_{round}_ALL_IITS_OR_CR.csv"
        df.to_csv(csv_filename, index=False)
        print(f"Success! Data seamlessly saved to {csv_filename}")

    except Exception as e:
        print(f"\nAn error occurred: {e}")
        driver.save_screenshot("josaa_js_error.png")
        print("Check 'josaa_js_error.png' to see where the bot stopped.")
    finally:
        driver.quit()

rounds={
    2024:5,
    2023:6,
    2022:6,
    2021:7,
    2020:6,
    2019:7,
    2018:7,
    2017:7,
    2016:6
}


if __name__ == "__main__":

    for year,r in rounds.items():
        for i in range(1,r+1):
            scrape_iitg_josaa_2024(round=i, year=year)


    # for year in [2016]:  # You can add more years to this list as needed
    #     # for i in range(1):
    #     scrape_iitg_josaa_2024(round=1, year=year)