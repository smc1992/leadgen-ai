Messe Duesseldorf Exhibitor List Scraper
Pay per event
skython/messe-duesseldorf-exhibitor-list-scraper

5.0
(2)
3
35
6
Crafted by
skython avatar
Skython
Start
Save as new task
API

Simple web scraper for extracting exhibitor data from trade show exhibitor lists provided by Messe Duesseldorf. Extract company details using this scraping tool for B2B lead generation and event networking. Supports multiple Messe Duesseldorf trade fair websites with a consistent HTML structure.
Input
Information
Runs
0
Builds
1
Integrations
0
Monitoring
Issues
0
Saved tasks
0
Reviews
Build
0.0.23 / latest



Readme

Input
🤖 Messe Duesseldorf Exhibitor List Scraper

Simple web scraper for extracting exhibitor data from trade show exhibitor lists provided by Messe Duesseldorf.

Easily scrape company profiles including company details, websites, social media links, product categories, contact persons and more.

Ideal for B2B lead generation, market research, event networking, and competitive analysis.

Supports multiple Messe Duesseldorf trade fair websites with a consistent HTML structure.

🔎 Testing Exhibitor List URLs for FREE

Since I have multiple exhibitor list scraper actors for different types of trade event websites, it might be hard to find the correct actor for your exhibitor list URL.

Use 
Exhibitor List Scrapers Router & URL Tester
 actor to test your exhibitor list URLs for FREE and see which scraper can process them.

🎯 Supported Website Structure

This scraper is designed to extract data from exhibitor directories with the same HTML structure as the supported Messe Duesseldorf exhibitor lists below.

Exhibitor listing page URLs contain /vis/v1/.

Take a look at some of the event websites from the below list. Your event website URL might be in that list.

If you are not sure about if this actor is capable of scraping your event URL, test it with
Exhibitor List Scrapers Router & URL Tester
 actor.

🌐 Supported Messe Duesseldorf Events (Exhibitor Lists)

Note: The following partial list includes Messe Duesseldorf exhibitor directory URLs that have been tested so far. Other Messe Duesseldorf or different events with the same website structure may also be supported.

Full list of supported events: 
View on GitHub

A+A 2025 Exhibitor List

Beauty Duesseldorf 2025 Exhibitor List

Boot Duesseldorf 2025 Exhibitor List

Caravan Salon Duesseldorf 2025 Exhibitor List

COMPAMED & MEDICA 2025 Exhibitor List

EuroCIS 2025 Exhibitor List

EuroShop 2023 Exhibitor List

GIFA 2023 Exhibitor List

glasstec 2024 Exhibitor List

interpack 2026 Exhibitor List

MEDICA & COMPAMED 2025 Exhibitor List

METEC 2023 Exhibitor List

NEWCAST 2023 Exhibitor List

K 2025 Exhibitor List

ProWein 2025 Exhibitor List

REHACARE 2025 Exhibitor List

TOP HAIR 2025 Exhibitor List

VALVE WORLD EXPO 2024 Exhibitor List

XPONENTIAL Europe 2025 Exhibitor List

wire Duesseldorf 2024 Exhibitor List

📌 Use Cases

B2B Lead Generation: Build targeted contact lists for marketing and sales outreach.

Market Research: Analyze exhibitors by product categories, brands, and sectors.

Event Networking: Familiarize yourself with exhibitors before attending trade fairs.

Competitive Analysis: Track competitor participation and product focus areas.

💰 How much does scraping a Messe Duesseldorf Exhibitor List cost?

This scraper uses a pay-per-event (PPE) pricing model. There are three types of events that generate a charge:

Starting Actor → $0.005
Scraping Exhibitor → $0.003 per exhibitor
Scraping Contact Person → $0.001 per contact person
For example, scraping a Messe Duesseldorf Exhibitor List with 1,000 exhibitors and 1,000 contact persons will cost:

$0.005 + ($0.003 × 1000) + ($0.001 × 1000) = $4.005
🚀 How to Use Messe Duesseldorf Exhibitor List Scraper?

Go to the Actor’s Input tab or click Try for free.

Enter the Exhibitor List URL of a Messe Duesseldorf exhibitor directory page that matches the supported format.

English version of the URL is expected.
This actor expects the Exhibitor Listing Page URL itself, not the homepage URL of the event website.
Select the preferred Output Data Format: Compact format or Expanded format.

Default is the Compact format.
Check Output Data Formats section to see format details.
Click Save & Start to launch the scraping process.

When Messe Duesseldorf Exhibitor List Scraper has finished, preview or download your data from the Output tab.

🔒 Free Plan Limitations

Free plan users can scrape up to 20 exhibitors per run. Upgrade to a paid Apify plan to unlock full access and scrape all exhibitors.

📊 Data Fields

Exhibitor Profile URL	Company Name	Company Address
Company Country	Company Phone	Company Website
Company Email	Hall Stands	Main Exhibitor Name
Main Exhibitor Profile URL	Co-Exhibitors	Company URL LinkedIn
Company URL Facebook	Company URL Instagram	Company URL Twitter
Company URL Youtube	Company URL Tiktok	Product Categories
Business Data	Contact Persons	
📂 Output Data Formats

There are 2 different output data formats, Compact format and Expanded format.

1. Compact format (all product groups/categories in one row)

In this format, product groups/categories will be saved in one row. Check All Fields view in the Output tab to see product groups/categories.

Exhibitor Profile URL	Company Name	Company Address	Company Country	Company Phone	Company Email	Company Website	Hall Stands	Main Exhibitor Name	Main Exhibitor Profile URL	Co-Exhibitors	Company URL LinkedIn	Company URL Facebook	Company URL Instagram	Company URL Twitter	Company URL Youtube	Company URL Tiktok	Contact Person Name	Contact Person Email	Contact Person Phone	Contact Person Position	Contact Person LinkedIn	Contact Person Instagram	Contact Person Facebook	Contact Person Youtube
https://www.caravan-salon.com/vis/v1/en/exhprofiles/1rLx84odS5OdWmqA3Vc1KA	Across Car SL	Algezar, 9 Pol. Ind. Tres Hermanas, Aspe, 03680, Spain	Spain	+34 96 5483633	informacion@across-car.es	https://www.across-car.es	Hall 11 / B69					https://www.facebook.com/acrosscaroficial#	https://www.instagram.com/acrosscar/	https://x.com/acrosscar	https://www.youtube.com/@acrosscar-caravanasyautoca5688		Sandra Lencina	info@across-car.es	+34 965483633 | +34 670346041	Administration				
2. Expanded format (one row per product group/category)

In this format, the output data will be expanded by product categories. You will see a new row for each product category and subcategory.

This format is for someone who wants to filter exhibitors by product categories in Excel. Make sure to select the All Fields view while exporting the output data if you choose this format.

Exhibitor Profile URL	Company Name	Company Address	Company Country	Company Phone	Company Email	Company Website	Hall Stands	Main Exhibitor Name	Main Exhibitor Profile URL	Co-Exhibitors	Company URL LinkedIn	Company URL Facebook	Company URL Instagram	Company URL Twitter	Company URL Youtube	Company URL Tiktok	Category Level 1	Category Level 2	Contact Person Name	Contact Person Email	Contact Person Phone	Contact Person Position	Contact Person LinkedIn	Contact Person Instagram	Contact Person Facebook	Contact Person Youtube
https://www.caravan-salon.com/vis/v1/en/exhprofiles/1rLx84odS5OdWmqA3Vc1KA	Across Car SL	Algezar, 9 Pol. Ind. Tres Hermanas, Aspe, 03680, Spain	Spain	+34 96 5483633	informacion@across-car.es	https://www.across-car.es	Hall 11 / B69					https://www.facebook.com/acrosscaroficial#	https://www.instagram.com/acrosscar/	https://x.com/acrosscar	https://www.youtube.com/@acrosscar-caravanasyautoca5688		Caravans / Trailers	Off-road and cross-country trailers	Sandra Lencina	info@across-car.es	+34 965483633 | +34 670346041	Administration				
https://www.caravan-salon.com/vis/v1/en/exhprofiles/1rLx84odS5OdWmqA3Vc1KA	Across Car SL	Algezar, 9 Pol. Ind. Tres Hermanas, Aspe, 03680, Spain	Spain	+34 96 5483633	informacion@across-car.es	https://www.across-car.es	Hall 11 / B69					https://www.facebook.com/acrosscaroficial#	https://www.instagram.com/acrosscar/	https://x.com/acrosscar	https://www.youtube.com/@acrosscar-caravanasyautoca5688		Caravans / Trailers	Sport and recreational trailers	Sandra Lencina	info@across-car.es	+34 965483633 | +34 670346041	Administration				
https://www.caravan-salon.com/vis/v1/en/exhprofiles/1rLx84odS5OdWmqA3Vc1KA	Across Car SL	Algezar, 9 Pol. Ind. Tres Hermanas, Aspe, 03680, Spain	Spain	+34 96 5483633	informacion@across-car.es	https://www.across-car.es	Hall 11 / B69					https://www.facebook.com/acrosscaroficial#	https://www.instagram.com/acrosscar/	https://x.com/acrosscar	https://www.youtube.com/@acrosscar-caravanasyautoca5688		Motor caravans	Detachable cabins / Interchangeable cabins (for pick-up and platform trucks)	Sandra Lencina	info@across-car.es	+34 965483633 | +34 670346041	Administration				
https://www.caravan-salon.com/vis/v1/en/exhprofiles/1rLx84odS5OdWmqA3Vc1KA	Across Car SL	Algezar, 9 Pol. Ind. Tres Hermanas, Aspe, 03680, Spain	Spain	+34 96 5483633	informacion@across-car.es	https://www.across-car.es	Hall 11 / B69					https://www.facebook.com/acrosscaroficial#	https://www.instagram.com/acrosscar/	https://x.com/acrosscar	https://www.youtube.com/@acrosscar-caravanasyautoca5688		Motor caravans	Other vehicles	Sandra Lencina	info@across-car.es	+34 965483633 | +34 670346041	Administration				
👇 Check My Other Exhibitor List Scrapers

Koelnmesse Exhibitor List Scraper

Messe Frankfurt Exhibitor List Scraper

Map Your Show Exhibitor List Scraper

Xporience Exhibitor List Scraper

Reed Expo Exhibitor List Scraper

Messe Muenchen Exhibitor List Scraper

Xporience Exhibitor List Scraper V2

Nuernberg Messe Exhibitor List Scraper

GSMA MWC Exhibitor List Scraper

Messe Berlin Exhibitor List Scraper

AFAG Messe Exhibitor List Scraper

