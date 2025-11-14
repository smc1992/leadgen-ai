Messe Berlin Exhibitor List Scraper
Pay per event
skython/messe-berlin-exhibitor-list-scraper

5.0
(1)
2
4
3
Crafted by
skython avatar
Skython
Start
Save as new task
API

Simple web scraper for extracting exhibitor data from trade show exhibitor lists provided by Messe Berlin. Extract company details using this scraping tool for B2B lead generation and event networking. Supports multiple Messe Berlin trade fair websites with a consistent HTML structure.
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
0.0.5 / latest



Readme

Input
🤖 Messe Berlin Exhibitor List Scraper

Simple web scraper for extracting exhibitor data from trade show exhibitor lists provided by Messe Berlin.

Easily scrape company profiles including company details, websites, social media links, product categories, contact persons, and more.

Ideal for B2B lead generation, market research, event networking, and competitive analysis.

Supports multiple Messe Berlin trade fair websites with a consistent HTML structure.

🔎 Testing Exhibitor List URLs for FREE

Since I have multiple exhibitor list scraper actors for different types of trade event websites, it might be hard to find the correct actor for your exhibitor list URL.

Use 
Exhibitor List Scrapers Router & URL Tester
 actor to test your exhibitor list URLs for FREE and see which scraper can process them.

🎯 Supported Website Structure

This scraper is designed to extract data from exhibitor directories with the same HTML structure as the supported Messe Berlin exhibitor lists below.

This actor is expecting an event URL that contains /showfloor/organizations.

Take a look at some of the event websites from the below list. Your event website URL might be in that list.

If you are not sure about if this actor is capable of scraping your event URL, test it with
Exhibitor List Scrapers Router & URL Tester
 actor.

🌐 Supported Messe Berlin Events (Exhibitor Lists)

Note: The following partial list includes Messe Berlin exhibitor directory URLs that have been tested so far. Other Messe Berlin or different events with the same website structure may also be supported.

CMS Berlin Exhibitor List

DMEA Exhibitor List

European Coatings Show Exhibitor List

Fruit Logistica Exhibitor List

IAA Transportation Exhibitor List

Smart Country Convention Exhibitor List

Spielwarenmesse Exhibitor List

📌 Use Cases

B2B Lead Generation: Build targeted contact lists for marketing and sales outreach.

Market Research: Analyze exhibitors by product categories, brands, and sectors.

Event Networking: Familiarize yourself with exhibitors before attending trade fairs.

Competitive Analysis: Track competitor participation and product focus areas.

💰 How much does scraping a Messe Berlin Exhibitor List cost?

This scraper uses a pay-per-event (PPE) pricing model. There are two types of events that generate a charge:

Starting Actor → $0.005
Scraping Exhibitor → $0.003 per exhibitor
For example, scraping a Messe Berlin Exhibitor List with 1,000 exhibitors will cost:

$0.005 + ($0.003 × 1000) = $3.005
🚀 How to Use Messe Berlin Exhibitor List Scraper?

Go to the Actor’s Input tab or click Try for free.

Enter the Exhibitor List URL of a Messe Berlin exhibitor directory page that matches the supported format.

This actor expects the Exhibitor Listing Page URL itself, not the homepage URL of the event website.
Select the preferred Output Data Format: Compact format or Expanded format.

Default is the Compact format.
Check Output Data Formats section to see format details.
Click Save & Start to launch the scraping process.

When Messe Berlin Exhibitor List Scraper has finished, preview or download your data from the Output tab.

🔒 Free Plan Limitations

Free plan users can scrape up to 20 exhibitors per run. Upgrade to a paid Apify plan to unlock full access and scrape all exhibitors.

📊 Data Fields

Exhibitor Profile URL	Company Name	Company Address
Company Country	Company Phone	Company Email
Company Website	Hall Stands	Company Size
Industry	Founding Year	Co-Exhibitors
Main Exhibitors	Company URL LinkedIn	Company URL Facebook
Company URL Instagram	Company URL Twitter	Company URL Youtube
Company URL Tiktok	Product Categories	Contact Persons
📂 Output Data Format

There are 2 different output data formats, Compact format and Expanded format.

1. Compact format (all product categories in one row)

In this format, product categories will be saved in one row. Check All Fields view in the Output tab to see product categories.

Exhibitor Profile URL	Company Name	Company Address	Company Country	Company Phone	Company Email	Company Website	Hall Stands	Company Size	Industry	Founding Year	Co-Exhibitors	Main Exhibitors	Company URL LinkedIn	Company URL Facebook	Company URL Instagram	Company URL Twitter	Company URL Youtube	Company URL Tiktok	Contact Person Name	Contact Person Title	Contact Person Company
https://exhibitors.iaa-transportation.com/company/Alton-Air-Springs--3800106	Alton Air Springs	Işıktepe OSB Mh. Kahverengi Cd., 2. Sokak No : 3 Nilüfer, BURSA, 16140, Türkiye	Türkiye	+90 224 411 23 53	muhammet.seyitler@altonairsprings.com	www.altonairsprings.com.tr	hall 26 | E19				Orsan			http://www.facebook.com/altonairsprings.com	https://www.instagram.com/altonairsprings/		https://www.youtube.com/watch?v=WLzNYdQphcE		Muhammet Seyitler	Department head / Group head	Alton Air Springs
2. Expanded format (one row per product group)

In this format, the output data will be expanded by product groups. You will see a new row for each product group.

This format is for someone who wants to filter exhibitors by product groups in Excel. Make sure to select the All Fields view while exporting the output data if you choose this format.

Exhibitor Profile URL	Company Name	Company Address	Company Country	Company Phone	Company Email	Company Website	Hall Stands	Company Size	Industry	Founding Year	Co-Exhibitors	Main Exhibitors	Company URL LinkedIn	Company URL Facebook	Company URL Instagram	Company URL Twitter	Company URL Youtube	Company URL Tiktok	Contact Person Name	Contact Person Title	Contact Person Company	Product Category Level 1	Product Category Level 2	Product Category Level 3
https://exhibitors.iaa-transportation.com/company/Alton-Air-Springs--3800106	Alton Air Springs	Işıktepe OSB Mh. Kahverengi Cd., 2. Sokak No : 3 Nilüfer, BURSA, 16140, Türkiye	Türkiye	+90 224 411 23 53	muhammet.seyitler@altonairsprings.com	www.altonairsprings.com.tr	hall 26 | E19				Orsan			http://www.facebook.com/altonairsprings.com	https://www.instagram.com/altonairsprings/		https://www.youtube.com/watch?v=WLzNYdQphcE		Muhammet Seyitler	Department head / Group head	Alton Air Springs	Suppliers: Parts and accessories; partly finished products	Springs and shock absorbers	Air suspensions
https://exhibitors.iaa-transportation.com/company/Alton-Air-Springs--3800106	Alton Air Springs	Işıktepe OSB Mh. Kahverengi Cd., 2. Sokak No : 3 Nilüfer, BURSA, 16140, Türkiye	Türkiye	+90 224 411 23 53	muhammet.seyitler@altonairsprings.com	www.altonairsprings.com.tr	hall 26 | E19				Orsan			http://www.facebook.com/altonairsprings.com	https://www.instagram.com/altonairsprings/		https://www.youtube.com/watch?v=WLzNYdQphcE		Muhammet Seyitler	Department head / Group head	Alton Air Springs	Suppliers: Parts and accessories; partly finished products	Springs and shock absorbers	Air suspension modules
https://exhibitors.iaa-transportation.com/company/Alton-Air-Springs--3800106	Alton Air Springs	Işıktepe OSB Mh. Kahverengi Cd., 2. Sokak No : 3 Nilüfer, BURSA, 16140, Türkiye	Türkiye	+90 224 411 23 53	muhammet.seyitler@altonairsprings.com	www.altonairsprings.com.tr	hall 26 | E19				Orsan			http://www.facebook.com/altonairsprings.com	https://www.instagram.com/altonairsprings/		https://www.youtube.com/watch?v=WLzNYdQphcE		Muhammet Seyitler	Department head / Group head	Alton Air Springs	Parts & Accessories		
👇 Check My Other Exhibitor List Scrapers

Koelnmesse Exhibitor List Scraper

Messe Frankfurt Exhibitor List Scraper

Map Your Show Exhibitor List Scraper

Messe Duesseldorf Exhibitor List Scraper

Xporience Exhibitor List Scraper

Reed Expo Exhibitor List Scraper

Messe Muenchen Exhibitor List Scraper

Xporience Exhibitor List Scraper V2

Nuernberg Messe Exhibitor List Scraper

GSMA MWC Exhibitor List Scraper

AFAG Messe Exhibitor List Scraper

💬 Feedback & Support

Have questions, suggestions, or found a bug? Create an issue in the 
Actor’s Issues tab
.

