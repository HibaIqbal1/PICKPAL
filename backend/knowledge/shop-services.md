# PickPal Shop Services Guide

## Overview of Shop Services

Shop Services on PickPal represent services offered at physical vendor locations where customers visit the shop in person rather than requesting doorstep delivery.

### Categories of Shop Services
- **Beauty & Grooming**: Salons, Barber Shops, Beauticians, Spa & Massage Parlors, Tattoo Studios.
- **Health & Wellness**: Local Medical Clinics, Dental Clinics, Optical Stores.
- **Apparel & Personal Care**: Tailoring & Alteration Shops, Laundromats & Dry Cleaners.
- **Vehicle Maintenance**: Garages, Bike Service Centers, Car Wash Depots.

### Booking Models for Shop Services

PickPal supports two distinct shop booking models:

1. **Appointment Booking (Scheduled Time Slot)**:
   - Customer selects a specific date, time slot, and preferred staff partner at the shop.
   - Requires upfront booking details and generates an appointment confirmation.

2. **Salon Token Queue Booking (Digital Walk-In Token)**:
   - Designed for high-volume local shops (salons, barbers, clinics) to eliminate long physical waiting lines.
   - Customers request a digital queue token from home or while traveling.
   - Generates a digital ticket (e.g., Token `Q-18`) with real-time queue tracking.

### Shop Profile & Catalog Features
- **Storefront Information**: Displays shop name, category, address, phone number, opening/closing hours, and overall rating.
- **Service Package List**: Displays individual services provided by the vendor along with prices, estimated durations, and assigned staff members.
- **Queue State Indicator**: Shows whether the shop's live digital queue is currently `active` or `paused`.

### Customer Visit & Verification Flow
- When visiting the shop, the customer presents their digital ticket on the PickPal app.
- The ticket displays a check-in OTP verification code and an SVG QR code for fast vendor scanning.
- Once verified, the shop staff updates the token status to `in_progress` and subsequently `completed`.
