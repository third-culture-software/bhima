# Scenario Descriptions for Payroll Processes
# Scenario Analysis for Payroll Calculation in the Index System


# 💰 Payroll Calculation with BHIMA

The **BHIMA** system provides a robust and flexible method for calculating employee payrolls, including the allocation (or "ventilation") of local allowances and bonuses. This system is based on a series of **index-based constants** that allow accurate and individualized payroll computation, especially in environments where **grade and experience** significantly affect earnings.

## ⚙️ Core Payroll Calculation Constants

- **📊 Base Index**  
  The base index reflects the foundational value for calculating payroll. It is configured either individually for each employee or assigned based on their professional grade.

- **📅 Day Index**  
  This is a daily coefficient used in payroll calculations. It helps in distributing the base index over the number of working days in a given period, ensuring a fair and proportional daily wage.

- **🔁 Registered Index**  
  This index represents the adjustment of the base index by adding the **Seniority Index**. It accounts for the number of years an employee has worked in the organization, rewarding loyalty and experience.

- **🧑‍💼 Responsibility Index**  
  This value reflects the employee’s primary role or responsibility. It is used to differentiate pay based on the complexity, scope, and importance of the tasks assigned.

- **🧾 Other Responsibility Index**  
  Additional responsibilities or extra roles taken by the employee beyond their main duty are factored here, ensuring all functions performed are fairly compensated.

- **🎁 Other Profit Index**  
  This includes any other advantages or bonuses an employee is entitled to. These may include incentives, risk allowances, or performance-related bonuses.

- **🧮 Total Code Index**  
  This is the sum of all applicable indices (Base, Registered, Responsibility, etc.). It represents the cumulative weight used in the payroll calculation.

## 🕒 Time and Workload Variables

- **📆 Days Worked**  
  The total number of days the employee has actively worked during the payroll period.

- **➕ Extra Days**  
  Refers to additional days worked beyond the normal schedule (e.g., weekends, holidays).

- **🔢 Total Days**  
  A combination of *Days Worked* and *Extra Days*, used to calculate pay for overtime or additional effort.

## 📈 Payroll Output Calculations

- **💸 Pay Rate**  
  This is the monetary value of one unit of the Total Code Index. It is calculated by dividing the total payroll envelope (budget) by the sum of all employees’ Total Code Indices. This ensures proportional and fair distribution of the payroll budget.

- **🏆 Performance Rate**  
  Although optional, this rate can be used to increase the pay of employees based on individual performance evaluations, driving productivity and engagement.

- **🧾 Gross Salary**  
  This is the total amount the employee receives before deductions. It is the result of multiplying the Pay Rate by the employee’s Total Code Index and adjusted for the Total Days.

- **📋 Number of Days**  
  Indicates the standard number of working days in the payroll period, used for reference and validation of actual days worked.

- **⏳ Seniority Index**  
  This index rewards long-serving employees by providing a percentage-based increment to the base index. It is crucial in systems where salary progression is tied to years of service rather than fixed promotions.

## 🏥 Index System Used by HGR (General Reference Hospital)

The HGR payroll model introduces a unique indexing approach that combines a **fixed base index** with **individual performance-based bonuses**. This hybrid system ensures both equity and meritocracy in the distribution of salaries and incentives.

### 🔄 Relative Point

The **Relative Point** is calculated by multiplying the **Fixed Base Index** with the **Individual Performance Rate**:
````Relative Point = Fixed Base Index × Individual Performance````


This index is not a monetary value but rather a **scoring unit** used in performance-based calculations.

**Characteristics:**
- ✅ Must be an index
- 💵 Not a direct monetary value
- ✋ Cannot be entered manually
- 🏷️ Index type: `Relative point`

This method ensures that performance contributes dynamically to the total remuneration without compromising the integrity of the base salary system.

---

### 🎯 Fixed Bonus

The **Fixed Bonus** is part of index-based systems where employees receive a **constant base index**, expressed as a percentage of the full base index. It does not depend on performance or days worked.

```` Fixed Bonus = Fixed Base Index × Pay Rate ````


This bonus provides a stable and predictable component of the salary, especially useful in administrative or non-clinical roles.

**Characteristics:**
- ✅ Must be an index
- 💵 Not a direct monetary value
- ✋ Cannot be entered manually
- 🏷️ Index type: `Fixed bonus`

This ensures fairness and consistency across employees holding similar functions with identical grade levels.

---

### 🏅 Performance Bonus

The **Performance Bonus** is calculated by proportionally distributing the **performance incentive envelope** across employees based on their relative points.

```` Performance Bonus = Performance Envelope / Sum of Relative Points ````


This creates a fair and transparent distribution system that aligns reward with measurable individual contributions.

---

### 📈 Individual Performance

The **Individual Performance** is a **percentage-based index** manually entered for each payroll configuration. It reflects the personal contribution and productivity of an employee during a specific pay period.

**Characteristics:**
- ✅ Must be an index
- 💵 Not a direct monetary value
- ✍️ Manually entered for each payroll session
- 🏷️ Index type: `Individual performance`

This approach supports **accountability** and encourages **efficiency**, rewarding those who consistently meet or exceed expectations.

---

**💡 Summary:**  
The HGR index system introduces a blend of fixed and performance-based compensation, fostering a workplace culture that values both **stability** and **merit**. The clear distinction between monetary and index values ensures transparency and accurate payroll processing.

---

## 📅 Indexed Payroll Scenario – Local Bonus Distribution

This section explains the indexed payroll distribution scenario for a specific pay period under the **"Ventilation de la prime locale"** system.

### 📌 Payroll Key Deliverable 4 – INDEXED
**Period:** January 1st to January 31st, 2025

The payroll configuration includes various indexed components categorized by their role in salary computation. This method ensures a structured and flexible calculation model, especially useful in environments with performance-sensitive pay such as hospitals or public institutions.

---

### 🧾 Configured Payroll Items for the Period

Each item below is defined by its **type (index or monetary)**, whether it is **manually entered**, and its **functional classification** in payroll.

- 💵 **ACOMPTE SUR SALAIRE**  
  *Advance on Salary*  
  - Type: Index  
  - Value: Monetary  
  - Entry: Required  

- 💰 **AUTRES PRIMES – INDEXÉES**  
  *Other Indexed Bonuses*  
  - Type: Index  
  - Entry: Required  
  - Category: `Other profit`

- 💸 **AVANCE SUR SALAIRE**  
  *Salary Advance*  
  - Type: Index  
  - Value: Monetary  
  - Entry: Required  

- 📊 **BASE DE CALCUL INITIALE**  
  *Initial Base Index*  
  - Type: Base Index  
  - Entry: System-defined  

- 📆 **BASE DES JOURS PRESTÉS**  
  *Reajusted Index (Seniority + Base)*  
  - Type: Reajusted Index  
  - Entry: Auto-calculated  

- 🧮 **BASE SALARIALE ET AVANTAGES – INDEXÉS**  
  *Indexed Salary and Benefits Base*  
  - Type: Total Code (Sum of Indices)  
  - Entry: System-generated  

- ⏱️ **HEURES SUPPLÉMENTAIRES – INDEXÉES**  
  *Indexed Overtime*  
  - Type: Index  
  - Entry: Required  
  - Category: `Other profit`

- 📅 **INDEMNITÉ POUR JOUR FÉRIÉ – INDEXÉE**  
  *Holiday Work Compensation*  
  - Type: Index  
  - Entry: Required  
  - Category: `Other profit`

- ➕ **JOURS SUPPLÉMENTAIRES**  
  *Extra Days Worked*  
  - Type: Index  
  - Entry: Required  
  - Classification: `Extra days`

- 💼 **MONTANT BRUT À PAYER – INDEXÉ**  
  *Gross Amount to be Paid*  
  - Type: Gross Salary  
  - Entry: Final calculated value  

- 📋 **NOMBRE DE JOURS PRESTÉS**  
  *Days Worked*  
  - Type: Index  
  - Entry: Required  
  - Classification: `Days worked`

- 🌴 **PÉCULE DE CONGÉ ANNUEL – INDEXÉ**  
  *Annual Leave Bonus*  
  - Type: Index  
  - Entry: Required  
  - Category: `Other profit`

- 📟 **PRIME D’ASTREINTE – INDEXÉE**  
  *On-call Duty Bonus*  
  - Type: Index  
  - Entry: Required  
  - Category: `Other profit`

- 🌙 **PRIME POUR TRAVAIL DE NUIT – INDEXÉE**  
  *Night Shift Bonus*  
  - Type: Index  
  - Entry: Required  
  - Category: `Other profit`

- 🏥 **PRISE EN CHARGE DES SOINS MÉDICAUX**  
  *Medical Coverage*  
  - Type: Index  
  - Value: Monetary  
  - Entry: Required  

- 🧑‍💼 **RESPONSABILITÉ**  
  *Responsibility Index*  
  - Type: Index  
  - Classification: `Responsibility`  
  - Entry: System-defined  

- 💱 **TAUX DE RÉMUNÉRATION**  
  *Pay Rate*  
  - Type: Index  
  - Classification: `Pay rate`  
  - Entry: System-calculated  

- 🧾 **TOTAL DES JOURS**  
  *Total Number of Days*  
  - Computed as:  
    ```
    Total Days = Days Worked + Extra Days
    ```  
  - Entry: Automatically calculated  

---

### 🎯 Purpose of Indexed Payroll System

This indexed system:
- Promotes **fairness** and **scalability** in remuneration 🧘
- Ensures **modular and flexible salary structure** for both permanent and temporary staff 🧩
- Supports **manual input** only where required to ensure accuracy and accountability 📝
- Integrates **performance and contextual bonuses** (like night shifts, on-call duty) 🔍

By aligning base salary elements with real performance and activity levels, the system enables efficient resource allocation while rewarding effort and commitment. 📈

## 👤 Employee Configuration: Olivier Benjamin Hensley

As part of the employee configuration for the payroll period, a total of **69 employees** have been registered. For demonstration purposes, we will focus on one specific case:

### 📄 General Information
- **Name**: Olivier Benjamin Hensley
- **Hiring Date**: 🗓️ January 1, 2015
- **Seniority**: 🔟 years (as of January 1, 2025)

---

### 🏷️ Job Details
- **Grade**: 🧾 ATB1 – First-Class Office Assistant
- **Position**: 🩺 Nurse
- **Base Index**: 📌 200
- **Responsibility Index** (linked to the function): 🎯 60

---

### 📈 Seniority Adjustment
The adjustment of the base index is calculated according to the **annual index growth rate (%)** defined in the **Payroll Settings**:

- **Annual growth rate**: 🌱 `5%`
- **Years of seniority**: `10 years`

#### 🧮 Adjusted Base Index Calculation
> Adjusted Index = Base Index × (1 + growth rate) ^ years of seniority
> Adjusted Index = 200 × (1 + 0.05) ^ 10 ≈ 200 × 1.62889 ≈ 325.78


🧾 **Approximate Adjusted Index**: **326**

---

### ➕ Total Payroll Index (Including Responsibility)

> Total Index = Adjusted Index + Responsibility Index Total Index = 326 + 60 = 386


✅ **Total Compensation Index**: **386**

---

### 🧠 Notes:
- ✅ All indices are **non-monetary** and used only for payroll calculations.
- 📥 The responsibility index is **predefined by position**.
- 📐 The seniority-based adjustment is **automatically computed** annually.
- 👨‍⚕️ This index-based model promotes a **meritocratic and progressive approach** to compensation in healthcare institutions.


## 📊 Base Index Progression Over 10 Years

In the BHIMA payroll system, the **Base Index** evolves annually based on the configured **Base Index Growth Rate**, which in this case is **5% per year**. Below is the year-by-year growth for the employee **Olivier Benjamin Hensley**:

| 📆 Year | 🗓️ Payroll Year | 📈 Base Index |
|--------|------------------|----------------|
| Year 0 | 2015             | 200            |
| Year 1 | 2016             | 210            |
| Year 2 | 2017             | 221            |
| Year 3 | 2018             | 232            |
| Year 4 | 2019             | 243            |
| Year 5 | 2020             | 255            |
| Year 6 | 2021             | 268            |
| Year 7 | 2022             | 281            |
| Year 8 | 2023             | 295            |
| Year 9 | 2024             | 310            |
| Year 10| 2025             | 326            |

---
## 💼 Payroll Simulation for the Year 2025 (Indexed Payroll System)

For the year **2025**, the employee **Olivier Benjamin Hensley** has a **Base Index** of **326**. Let’s simulate his payroll using the indexed system in BHIMA, assuming the following conditions:

### 🎁 Additional Benefits for the Payroll Period

- 🌙 **Night Work Bonus – Indexed**: 2
- ⏱️ **Overtime Hours – Indexed**: 3
- 🧑‍💼 **Days Worked**: 23
- ➕ **Extra Days**: 4

### 💰 Payroll Envelope

- **Total Payroll Envelope**: **$14,000**
- **Standard Working Days** (`Days of Work`): **23 days**

---
## ⚙️ How the Indexed Payroll Algorithm Works

### 👨‍💼 Employee Work Summary
- 📅 **Worked Days**: 23
- ➕ **Additional Days**: 4  
- 📊 **Total Days Counted**: 27

---

### 🧮 Step 1: Daily Index Calculation
We calculate the daily index by dividing the **Base Index** and **Responsibility Index** by the number of standard worked days:

> Daily Index = (Base Index + Responsibility Index) / Worked Days = (326 + 60) / 23 = 16.782


➡️ **📌 Daily Index = 16.782**

---

### ✖️ Step 2: Adjusted Index Calculation
Multiply the **Daily Index** by the **Total Days Worked (including additional days)** to get the adjusted index:

> Adjusted Index = Daily Index × Total Days = 16.782 × 27 ≈ 453.13


➡️ **📘 BASE OF DAYS WORKED = 453.13**

---

✅ This adjusted index becomes the foundation for calculating the employee’s salary and all indexed benefits.

---

### ➕ Additional Indexed Benefits

- **Night Shift Bonus – Indexed**: 2
- **Overtime – Indexed**: 3

> Base Salary and Indexed Benefits = 453.130435 + 2 + 3 = 458.130435


➡️ **BASE SALARY AND INDEXED BENEFITS** = **458.13**

The **Total Code** for this employee is calculated by summing all indexed elements, including benefits.

➡️ **TOTAL CODE** = **458.1304**

---

### 💰 Remuneration Rate Calculation

For all configured employees, the system has calculated:

- **SUM of BASE SALARY AND INDEXED BENEFITS** = **53,232.52**
- **Total Payroll Envelope** = **$14,000**

> PAY RATE = 14,000 / 53,232.52 ≈ 0.26


➡️ **REMUNERATION RATE** = **$0.26 per index point**

---

### 🧾 Final Gross Pay

The **Gross Amount to be Paid** for the employee is calculated as:

> GROSS SALARY = BASE SALARY AND INDEXED BENEFITS × REMUNERATION RATE = 458.1304 × 0.26 ≈ $120.49


➡️ **GROSS SALARY – INDEXED** = **$120.49**

---

### ⚙️ System Flexibility with Indexed Configuration

The indexed payroll system allows you to configure:

- 💵 **Advances**
- 💰 **Salary Prepayments (Accomptes)**

These must be configured as **indexed values**, with:

- ✅ **A monetary value**
- ✅ **"This index is to be entered"** set to true

This ensures that all these components are properly integrated into the indexed payroll structure and calculated dynamically during the payroll process.



