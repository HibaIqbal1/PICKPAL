# PickPal Services Overview

## PickPal Service Catalog

PickPal provides a hyperlocal quick-commerce marketplace and on-demand service delivery platform. Services are grouped into four primary operational categories: **Home Services**, **Shopping Errands**, **Pick & Drop Services**, and **Personal/Shop Services**.

### Service Categories & Groups

1. **Hardware & Maintenance (`hardware`)** — Home & Technical Repair Services:
   - **Electrician**: Wiring, fixture installation, fuse repairs, appliance socket troubleshooting.
   - **Plumber**: Pipe leaks, tap replacements, drainage unblocking, sanitary fitting.
   - **Carpenter**: Furniture assembly, door lock repairs, woodwork restoration.
   - **Painter**: Wall touch-ups, full room painting, exterior waterproofing.
   - **AC Repair**: Air conditioner servicing, gas refilling, filter cleaning, cooling issues.
   - **Appliance Repair**: Washing machine, refrigerator, microwave, and TV repair.

2. **Shopping Errands (`grocery`, `pharmacy`, `electronics`, `other`)**:
   - **Grocery**: Sub-30 minute delivery of fresh produce, dairy, packaged foods, household essentials.
   - **Medicine**: Prescription and OTC pharmaceutical fulfillment from licensed local chemist shops.
   - **Electronics**: Mobile accessories, cables, chargers, small electronic gadgets.
   - **Fashion**: Clothing, footwear, local boutique retail pickups.
   - **Pet Supplies**: Pet food, toys, grooming products from local pet stores.
   - **Gifts**: Flowers, chocolates, greeting cards, custom gift items.

3. **Pick & Drop Courier Services (`pickup`)**:
   - **Parcel**: Point-to-point courier delivery of physical goods within the city.
   - **Documents**: Secure transport of confidential paperwork, legal documents, contracts.
   - **Food Pickup**: Pickup from restaurants or home kitchens without built-in delivery.
   - **Cake Pickup**: Delicate handling and transport of bakery cakes and pastries.
   - **Medicine Pickup**: Urgent document or prescription pickup from medical centers.

4. **Personal & Shop Services (`personal`)**:
   - **Laundry**: Dry cleaning, wash & fold, iron press services.
   - **Tailoring**: Stitching, alterations, custom garment fitting.
   - **Salon**: Haircuts, styling, hair treatments.
   - **Beautician**: Facials, makeup, waxing, manicures, pedicures.
   - **Barber**: Beard trim, shaving, men's haircuts.
   - **Spa**: Massages, wellness therapy, relaxation packages.

### Service Classification: Home Visit vs. Shop Visit

In the PickPal system, services are categorized dynamically into two execution modes:
- **`HOME_SERVICE`**: Verified workers travel directly to the customer's specified location (e.g., Electrician, Plumber, Cleaning, AC Repair, Appliance Repair, Gardening, Grocery Run, Parcel Pick & Drop).
- **`VISIT_SHOP`**: Customers visit a physical partner shop or service center (e.g., Salon, Beautician, Barber, Spa, Laundry, Tailoring, Mobile/Laptop Repair, Dental Clinic, Garage).

### Pricing & Fees Architecture
- **Starting Price**: Base fee displayed on service discovery cards.
- **Inspection Fee**: Applicable for technical repair services (e.g., electrician, plumbing, AC repair) where final quotes are provided after on-site diagnostic.
- **Budget Cap**: For custom shopping errands, customers define a budget cap (`budgetCap`) to cap worker spending.
- **Pricing Note**: Not specified in the current PickPal system for unlisted custom items; custom prices are approved via checkout approvals in real time.
