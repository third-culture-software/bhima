# Scenario Descriptions for Payroll Processes

This document describes how the BHIMA payroll process works under a classical payroll structure where employees 
are retained on contract with a fixed base salary.  This payroll structure is rarely used in most hospitals though,
due to unpredictable monthly revenue.  Most institutions should opt for the index-based payroll structure that allows 
the human resources expenses to flex with the institutional revenue.

The basic operations of payroll are: 
 1. Computation of the employee base salary
 2. Calculating (taxed and untaxed) additions
 3. Calculating (taxed and untaxed) withholdings 
 4. Calculate the taxes on all of the above.

Each one of these operations have multiple steps and may happen in a different order than described above.

## Payroll Scenarios

For this analysis, we'll be used the first month of January, 2025.  The payroll period begins on January 1st and ends on January 31st, 2025.
There are a total of 74 employees employed at the institution for this payroll period, but we will focus more specifically on the following employees:

1. Amelia Rose Thornton
2. Ethan James Caldwell
3. Harper Elise Whitmore
4. Olivier Benjamin Hensley

These employees all have unique employment conditions that demonstrate how BHIMA payroll works. Below, we'll walk through the payroll calculations for each of them.

### Payroll Configuration

Before starting the payroll process, there are a number of important configuration decisions that need to determined.

Firstly, the expense account for payroll transactions needs to be configured.  In the DRC's implementation of OHADA, the account **`[66110011] - Rémunération Personnel`** is the **expense account** that is debited when writing the base salary payroll transaction.  In BHIMA, each line of the payroll transaction is also linked to the employee ID to facilitate lookups and future reports.

Secondly, The payroll system needs to know the number of workdays are included in the payment period.  BHIMA can automatically calculate the number of workdays in a month based on the _weekend configuration_.  In these scenarios, the **Configuration Semaine Anglaise** was selected for determining workdays within the payroll period.
Under this configuration:

- **Saturday** and **Sunday** are not considered working days.  
- The payroll period of **January 2025** includes **23 working days**.

Finally, the decision between index-based or classical payroll needs to be configured in the payroll settings.  In these scenarios, we are using the classical payroll structure.

### Payroll Advances

Sometimes, an employee may want to receive a portion of their salary before the end of the month.  The institution is responsible for setting a reasonable policy for the frequency and amount of advances an employee can draw down against their salary.  These are referred to as advances or prepayments in BHIMA, and typically debit the employee account while crediting a cash or bank account.  Advances are usually not taxable.

During payroll process, the system needs to know how much of the previous advance to withhold from the employee's salary.  It may be that the employee has withdrawn more than their salary this month, in which case the human resources department needs to make determination about the amount to withhold.  Once that figure is determined, the accounting team should configure the rubric to determine this withholding amount.

Unlike other payroll configurations, advances are specific to employees that have received an advance.  Therefore, BHIMA needs to be told this, using the option **"Will be associated with the employee ID"** in the rubric configuration page.

#### Configuration Properties (for deductions)

- **This rubric is an index**: Yes  
- **This rubric is a monetary value**: Yes  
- **Is it a deduction?**: Yes  
- **Is it a tax?**: No (usually non-taxable unless contractually specified)  

### Non-Taxable Withholdings (Social Expenses)

There are several shared rubrics that apply to these employees, which we'll call **Payroll Item Configuration**.  These include "social expenses", are designed to provide indirect compensation to employees without increasing their taxable income.  Therefore, non-taxable benefits increase the employees take-home pay, but the employee and institution do not pay taxes on them.

**Social expense items included:**
- **FAMILY ALLOWANCES**
- **IN-KIND BENEFIT – HOUSING**
- **TRANSPORT**

Social expenses can be either a fixed monetary amount or scale with the base salary.  For example, the **transport** rubric is a fixed value, non-taxable benefit that is paid directly to the employee.  However, **Housing** is a percentage of the base salary that is added to the gross salary, but not taxed.

<div class="bs-callout bs-callout-info">
<h4>Note / Remark</h4>
When configuring these rubrics, it is crucial to specify their *non-taxable* status in the system so that payroll calculations comply with local tax laws.
</div>

#### Example: Social Expense Rubric: **IN-KIND BENEFIT – HOUSING**

In BHIMA, these social expense are configured with the following properties:

- **Rubric Type**: Index  
- **Monetary Value**: Yes  
- **Is it an Addition?**: Yes  
- **Taxable**: No (Non-taxable)   

The **housing benefit** rubric is configured as a percentage-based index. Specifically, the system calculates the housing allowance as **30% of the base salary**, and this value is automatically added to the employee’s gross pay without affecting the taxable portion.

<div class="bs-callout bs-callout-success">
<h4>Best Practice</h4>
When configuring this rubric, ensure that it is clearly flagged as *non-taxable* and that its percentage rule (30%) is properly mapped in the payroll engine logic.
</div>

### Social Security / Pension Rubrics

In the DRC, social security is called "CNSS" and is required to be calculated and withheld each payroll period for each employee.  A portion of the social security expenses are borne by the employee and a portion are borne by the enterprise.  For DRC specifically, social security expenses paid by the employee are called QPO, while those paid by the enterprise are called QPP.  The QPP is also considered the retirement pension.

In the payroll configuration, **social contributions** are categorized into two types based on who bears the cost: the employee or the employer. These contributions are generally defined as **percentages** of the taxable base.  The employee-paid contribution is called COTISATION INSS QPO (social security) while the employer-paid contribution is called COTISATION INSS QPP (retirement pension).

<div class="bs-callout bs-callout-warning">
<h4>Note:</h4>
  <p>
  Social security contributions are withheld from the employee account  _after_ the taxes have been removed from the employee account. FIXME: is this correct?
  </p>
</div>

### Payroll Taxes

In the payroll system, **taxes** are classified into two main categories based on who bears the financial responsibility: the **employee** or the **employer**.  In the DRC, the **IMPÔT PROFESSIONNEL SUR LE REVENU (IPR)** represents the primary tax deducted directly from an employee’s gross taxable salary.  These tax rates are pre-determined by brackets set by the DRC Government, and this is controlled in BHIMA by the "is it IPR?" setting.

For the employee's share, once a rubric is flagged as **IPR**, a **dedicated algorithm is automatically triggered** by the system to perform the tax calculation. The algorithm uses the following formula:

> **IPR Base** = Base Salary + All Taxable Benefits – INSS Employee Share (QPO)

This ensures that only the net taxable income is used to compute the IPR.

Next we move to the employer's share of taxes.  These taxes are mandatory contributions paid **entirely by the employer**, calculated based on the base salary of each employee.  They are:

- **COTISATION ONEM** *(National Employment Office)*  
- **INSTITUT NATIONAL DES PRATIQUES PROFESSIONNELLES (INPP)**

These are configured as fixed percentages.

In addition to standard taxes and social contributions, the payroll system includes various **other rubrics**, categorized as either **salary deductions** or **employee benefits**. These rubrics enhance the flexibility of the payroll engine and reflect internal company policies and specific contractual agreements.

Deductions/withholdings are amounts subtracted from the employee’s salary, often related to personal financial obligations or internal company commitments.

Here are some examples:
- **Salary Advances**  
- **Salary Installments (Acomptes)**  
- **Internal Company Contributions**

### Benefits (Avantages)

These rubrics represent **additional income or perks** provided to employees. They may be taxable or non-taxable, depending on the country's tax code and how the rubric is configured.  Some of the common rubrics in the DRC are:

- **School Fees (FRAIS SCOLARITÉ)**  
- **Cost-of-Living Allowance (INDEMNITÉ VIE CHÈRE)**  
- **Performance Bonuses (PRIMES)**  
- **Seniority Bonus (PRIME D'ANCIENNETÉ)**

To configure these benefits, use the following:

#### Configuration Properties (for benefits)

- **This rubric is an index**: Yes  
- **This rubric is a monetary value**: Yes  
- **Is it an addition?**: Yes  
- **Taxable?**: Depending on national tax rules and rubric settings  

<div class="bs-callout bs-callout-info">
<h4>Note:</h4>
  <p>Always define whether the benefit is taxable or not during rubric setup. Taxable benefits must be included in the IPR base if applicable.</p>
</div>

### IPR Tax Bracket Configuration

Like many countries, the base payroll taxes in the DRC scale with the employee income, following a known set of tax brackets.  These brackets are called the IPR (Professional Income Tax) system. The payroll system supports the configuration of IPR (Professional Income Tax) brackets to accommodate different legal and fiscal frameworks. 

For these payroll scenario, we are using the **2013 tax bracket** as the official reference for IPR calculations.

## Scenario 1: Payroll Simulation for Employee — *Amelia Rose Thornton*

This scenario illustrates how payroll is calculated for a long-serving employee, **Amelia Rose Thornton**, using the configured rules in the classic payroll system.

### Employee Profile

- **Name**: Amelia Rose Thornton  
- **Date of Birth**: September 20, 1963  
- **Date of Hire**: January 1, 1983  
- **Seniority**: 42 years of service as of January 2025  

###  Payroll Period

- **Period**: January 1 – January 31, 2025  
- **Working Days**: 23 (based on English Week configuration)  
- **Days Worked**: 23 days  

### Seniority Bonus Calculation

The **Seniority Bonus** (*Prime d'ancienneté*) is calculated using the following formula:

```txt
Seniority Bonus = Basic Salary × Years of Service × Seniority Index
```


### Fixed Allowances & Deductions

| Rubric Type        | Description                         | Value (USD) |
|--------------------|-------------------------------------|-------------|
| **Advance**        | Salary advance received             | -100        |
| **Family Allowance** | Non-taxable benefit                | +30         |
| **School Fees**    | Educational support allowance       | +50         |
| **Bonus**          | Monthly fixed bonus                 | +25         |
| **Transport**      | Non-taxable transportation benefit  | +70         |

> 💬 *Comment*: The salary advance is a deduction from gross pay, while the other values are either taxable or non-taxable benefits based on rubric configuration.

---

### 🛠 Payroll System Considerations

- The system **does not allow manual entry** for rubrics that are automatically calculated (e.g., seniority bonus).
- Manual values must be entered for rubrics such as **days worked**, **advances**, and **fixed bonuses**, using the payroll configuration interface.

> 🧾 *Insight*: Proper tracking and entry of fixed allowances and deductions are crucial to ensure compliance with HR policy and transparency in salary computation.

---

In the configuration of payroll components, there are cases where an employee may cover the hospitalization costs of third parties (such as dependents or family members). These expenses can also be **withheld directly at the source** during the payroll configuration process.

Once the configuration is complete, the **BHIMA system proceeds with the payroll calculation** without generating the accounting entries. This stage is considered **provisional** and **can still be modified** as long as the accounting entries have not been validated.

---

### Payroll Analysis

The employee holds the **grade of "Junior Administrative Officer – 2nd Class"**. Since her individual base salary is set to **$0**, the system uses the **default base salary configured for her grade**, which is **$225**.

FIXME(@jniles) - this seems like an important fact to disclose earlier in the documentation.

Given that **January 2025 includes 23 working days**, the **daily pay rate** for this employee is **$9.782**. As she worked the full 23 days, her **total base salary** amounts to **$225**.

The **seniority bonus** is calculated automatically by the system, using the formula:

**Base Salary × Seniority Rate × Years of Service**

→ $225 × 0.035 × 42 = **$330.75**

---

### Additional Payments:

- **School Fees**: $50.00  
- **Bonuses**: $25.00  

---

### Taxable Gross Salary:

The **seniority bonus**, **school fees**, and **bonuses** are considered **taxable income**, giving a total taxable amount of:

**$330.70 + $50.00 + $25.00 = $405.70**


### **Breakdown of Taxable Earnings**

| Description               | Amount   |
|---------------------------|----------|
| **School Fees**           | $50.00   |
| **Cost of Living Allowance** | $0.00    |
| **Seniority Bonus**       | $330.75  |
| **Other Bonuses**         | $25.00   |
| **➡ Taxable Net Income**  | **$405.75** |


---

### **Breakdown of Non-Taxable Earnings**

| Description                           | Amount   |
|---------------------------------------|----------|
| **Family Allowance**                  | $30.00   |
| **In-Kind Benefit – Housing (30%)**   | $67.50   |
| **Transport Allowance**               | $70.00   |
| **➡ Non-Taxable Net Income**          | **$167.50** |

---

### **Gross Salary Calculation**

| Component                | Amount   |
|--------------------------|----------|
| **Base Salary**          | $225.00  |
| **Taxable Net Income**   | $405.75  |
| **Non-Taxable Net Income** | $167.50  |
| **➡ Gross Salary**       | **$798.25** |

---

### **Next Step: Deductions and Employee Contributions**

The next stage in the payroll process involves calculating the **deductions** and any **expenses borne by the employee**.

- **Salary Advance (Acompte sur salaire)** is only deducted if the employee received an advance during the month. The retained amount equals the value agreed upon with the institution.
  
- **INSS QPO (3.5%)** contribution is calculated by summing the **base salary** and **taxable net income**, then multiplying the result by **0.035**.

- **INSS QPP (5%)** follows the same procedure using the appropriate rate. Note that **INSS QPP is not deducted** from the gross salary.

---

### **Calculation Details**

| Description                 | Amount    |
|-----------------------------|-----------|
| **Base Salary**             | $225.00   |
| **Taxable Net Income**      | $405.75   |
| **Taxable Gross Salary**    | $630.75   |
| **INSS QPO (3.5%)**         | $22.08    |
| **INSS QPP (5%)**           | $31.54    |

---

### **Calculation of the Professional Income Tax (IPR)**

The calculation of the **Professional Income Tax (IPR)** is a specific process that requires the configuration of tax brackets defined by the **General Directorate of Taxes**. The **BHIMA system** supports the configuration and automatic calculation of the IPR tax.

#### **Step 1: Determine the IPR Tax Base**
To calculate the IPR base, the **employee share of the INSS contribution (QPO)** is subtracted from the **taxable gross salary**:

```
IPR Base in USD = $630.75 - $22.08 = $608.67
```

#### **Step 2: Convert to Local Currency**
Since the IPR tax brackets are defined in **Congolese Francs (CDF)**, the base must be converted using the applicable **exchange rate**. Assuming an exchange rate of **930 CDF per 1 USD**, the IPR base becomes:

```
IPR Base in CDF = $608.67 × 930 = 566,066.59 CDF
```

#### **Step 3: Annualize the Tax Base**
To determine the **annual cumulative IPR base**, the monthly base is multiplied by **12**:

```
Annual IPR Base = 566,066.59 × 12 = 6,792,799.05 CDF
```

> The BHIMA system then applies the configured progressive tax brackets to this annual base to calculate the monthly IPR deduction.

---


| RATE | Annual Bracket Start | Annual Bracket End | Monthly Bracket Start | Monthly Bracket End | Annual Range | Monthly Range | Annual Tax | Monthly Tax | Annual Cumulative | Monthly Cumulative | ANNUAL CUMULATIVE - 1 |
|------|----------------------|--------------------|------------------------|----------------------|---------------|----------------|-------------|---------------|----------------------|------------------------|-------------------------|
| 0%   | 0 FC                | 524,160 FC         | 0 FC                  | 43,680 FC            | 524,160 FC     | 43,680 FC       | 0 FC        | 0 FC          | 0 FC                 | 0 FC                   | 0 FC                   |
| 15%  | 524,160 FC          | 1,428,000 FC       | 43,680 FC             | 119,000 FC           | 903,840 FC     | 75,320 FC       | 135,576 FC  | 11,298 FC      | 135,576 FC           | 11,298 FC              | 0 FC                   |
| 20%  | 1,428,000 FC        | 2,700,000 FC       | 119,000 FC            | 225,000 FC           | 1,272,000 FC   | 106,000 FC      | 254,400 FC  | 21,200 FC      | 389,976 FC           | 32,498 FC              | 135,576 FC             |
| 22.5%| 2,700,000 FC        | 4,620,000 FC       | 225,000 FC            | 385,000 FC           | 1,920,000 FC   | 160,000 FC      | 432,000 FC  | 36,000 FC      | 821,976 FC           | 68,498 FC              | 389,976 FC             |
| 25%  | 4,620,000 FC        | 7,260,000 FC       | 385,000 FC            | 605,000 FC           | 2,640,000 FC   | 220,000 FC      | 660,000 FC  | 55,000 FC      | 1,481,976 FC         | 123,498 FC             | 821,976 FC             |
| 30%  | 7,260,000 FC        | 10,260,000 FC      | 605,000 FC            | 855,000 FC           | 3,000,000 FC   | 250,000 FC      | 900,000 FC  | 75,000 FC      | 2,381,976 FC         | 198,498 FC             | 1,481,976 FC           |
| 32.5%| 10,260,000 FC       | 13,908,000 FC      | 855,000 FC            | 1,159,000 FC         | 3,648,000 FC   | 304,000 FC      | 1,185,600 FC| 98,800 FC      | 3,567,576 FC         | 297,298 FC             | 2,381,976 FC           |
| 35%  | 13,908,000 FC       | 16,824,000 FC      | 1,159,000 FC          | 1,402,000 FC         | 2,916,000 FC   | 243,000 FC      | 1,020,600 FC| 85,050 FC      | 4,588,176 FC         | 382,348 FC             | 3,567,576 FC           |
| 37.5%| 16,824,000 FC       | 22,956,000 FC      | 1,402,000 FC          | 1,913,000 FC         | 6,132,000 FC   | 511,000 FC      | 2,299,500 FC| 191,625 FC     | 6,887,676 FC         | 573,973 FC             | 4,588,176 FC           |
| 40%  | 22,956,000 FC       | —                  | 1,913,000 FC          | —                    | —              | —               | —           | —              | -         | —                      | 6,887,676 FC                      |



---


#### 💼 **IPR Tax Calculation Based on Progressive Brackets (Payroll System Logic)**

In the context of payroll systems that automate tax computations based on progressive income tax brackets, we are analyzing an **IPR taxable base of 6,792,799.05 FC**. This amount falls within the income bracket ranging from **4,620,000 FC to 7,260,000 FC**, which corresponds to a tax rate of **25%** according to the applicable tax scale.

---

#### 📌 **Step-by-Step Breakdown**:

1. **Identify the taxable portion within the current bracket**  
   Before applying the 25% tax rate, we must isolate the income portion within the selected bracket:
   \[
   6,792,799.05 FC - 4,620,000 FC = 2,172,799.05 FC
   \]

2. **Apply the marginal tax rate to the excess amount**  
   The taxable amount within this bracket is then taxed at the applicable rate:
   \[
   2,172,799.05 FC \times 25\% = 543,199.76 FC
   \]

3. **Add the cumulative tax from the previous bracket**  
   Payroll systems generally store the **cumulative tax amount from all lower brackets**, which ensures accuracy and compliance with progressive taxation:
   \[
   543,199.76 FC + 821,976 FC = 1,365,175.76 FC
   \]

4. **Derive the monthly IPR liability**  
   Since payroll systems process employee taxes on a **monthly basis**, the annual tax must be converted to monthly:
   \[
   \ 1,365,175.76 FC / {12} = 113,764.65 {FC/month}
   \]

5. **Convert to USD (if payment is made in dollars)**  
   If the salary and tax payments are made in USD, the monthly tax is converted using the current exchange rate (e.g. **1 USD = 930 FC**):
   \[
   113,764.65FC / 930 = $122.33
   \]

---

### **Net Salary Calculation**

| **Description**                                    | **Amount (USD)** |
|----------------------------------------------------|-------------------|
| **Salary Advance**                                 | $100.00           |
| **INSS QPO Contribution (Social Security - 3.5%)**  | $22.08            |
| **Professional Income Tax (IPR)**                  | $122.33           |
| **Total Deductions**                               | **$244.41**       |



| **Description**                    | **Amount (USD)** |
|------------------------------------|-------------------|
| **Gross Salary**                   | $798.25           |
| **Total Deductions**               | $244.41           |
| **Net Salary (Gross Salary - Deductions)** | **$553.84**       |

The **Net Salary** is obtained by subtracting the **total deductions** from the **Gross Salary**, i.e.,  
$798.25 - $244.41 = **$553.84**.

This table format allows for a clear and structured presentation of the deduction calculations and net salary.


# 💼 Payroll Management: Continuity of Work

## 📘 Scenario 2: For Employees Ethan James Caldwell and Harper Elise Whitmore

Configuring payroll data for employees can be a tedious task, especially for organizations with a large workforce. It is possible to preconfigure specific payroll data or benefits for each employee.

To allow a payroll item to be set individually per employee, simply check the box **"Is defined per employee?"** ✅. This action will cause all payroll items with this property enabled to appear on the employee registration form, where values can be individually configured.

### 🎯 Objective

We will simulate the following case:

#### 👨‍💼 Ethan James Caldwell will receive:
- 👨‍👩‍👧‍👦 Family Allowances: $120  
- 🚕 Transport: $50

#### 👩‍💼 Harper Elise Whitmore will receive:
- 💸 Cost of Living Allowance: $5  
- 🚕 Transport: $40  
- 🎁 Other Bonuses: $10

Assuming both employees worked the full payroll period, we will proceed with their individual configuration.

---

## 🧾 1. Ethan James Caldwell

- 📅 Hired on: 01/01/1990 (35 years of service)
- 💰 Base Salary: $220 (customized, not grade-based)
- 👨‍👩‍👧 3 dependents (affects Professional Income Tax calculation)

### 🧮 Seniority Bonus Calculation  
`220 × 35 × 0.035 = $269.50`

### 🏠 Housing Benefit (30% of base)  
`220 × 0.3 = $66.00`

### 🚕 Transport Allowance  
`$50.00`

---

### 📊 Taxable and Non-Taxable Amounts

#### **Taxable Benefits**
- 🎓 School Fees: `$0.00`  
- 💸 Cost of Living Allowance: `$0.00`  
- 🧮 Seniority Bonus: `$269.50`  
- 🎁 Other Bonuses: `$0.00`  
- **🧾 Total Taxable Benefits: `$269.50`**

#### **Non-Taxable Benefits**
- 👨‍👩‍👧‍👦 Family Allowances: `$120.00`  
- 🏠 Housing (in-kind, 30%): `$66.00`  
- 🚕 Transport: `$50.00`  
- **🧾 Total Non-Taxable Benefits: `$236.00`**

### 💵 Summary
- Base Salary: `$220.00`  
- Net Taxable: `$269.50`  
- Net Non-Taxable: `$236.00`  
- **Gross Salary: `$725.50`**

---

## 🔻 Deductions and Contributions

Ethan did not receive any salary advance.

### 📉 INSS Contribution Calculation

- INSS QPO (3.5%): `(220 + 269.50) × 0.035 = $17.13`  
- INSS QPP (5%): `(220 + 269.50) × 0.05 = $24.48`  
- **Taxable Gross Salary: $489.50**

### 📐 IPR Base Calculation

- Base IPR = `489.50 - 17.13 = $472.37`  
- Exchange Rate: **1 USD = 930 CDF**  
- IPR Base in CDF = `472.37 × 930 = 439,301.78 CDF`  
- Annualized: `439,301.78 × 12 = 5,271,621.30 CDF`

#### 📊 IPR Tax Band:
- Falls within: `4,620,000 – 7,260,000 CDF`  
- Applicable Rate: 25%

#### 🧾 Calculation:
- Difference: `5,271,621.30 - 4,620,000 = 651,621.30`  
- Tax: `651,621.30 × 0.25 = 162,905.33`  
- Add lower bracket cumulative: `821,976 + 162,905.33 = 984,881.33`  
- Monthly IPR: `984,881.33 / 12 = 82,073.44 CDF`  
- Converted to USD: `82,073.44 / 930 = $88.25`

### 👶 Dependent Reduction
- 3 children → `88.25 × 0.02 × 3 = $5.30`  
- Final IPR = `88.25 - 5.30 = **$82.96**`

---

## 📉 Total Deductions

| Description                              | Amount  |
|------------------------------------------|---------|
| 💵 Salary Advance                        | $0.00   |
| 🏥 INSS QPO (3.5%)                       | $17.13  |
| 🧾 IPR                                   | $82.96  |
| **🔻 Total Deductions**                  | **$100.99** |

---

## 💸 Net Salary Calculation

- **Gross Salary**: `$725.50`  
- **Deductions**: `$100.99`  
- **✅ Net Salary**: `$625.41`

---

> 📌 *This breakdown allows payroll managers to better understand the importance of configuring individualized components for employees and their tax implications. Custom configurations such as bonuses, family allowances, and tax exemptions are critical in a comprehensive payroll system.*

---

## 👤 Employee: Harper Elise Whitmore

### 📅 Employment Details
- **Date of Hire:** 17/06/2021
- **Years of Service:** 3 years
- **Base Salary (Custom):** $30 (not linked to grade)
- **Dependents:** 1

### 🌴 Leave Information
- **Leave Period:** January 15 to January 28
- **Leave Type:** Leave of absence
- **Leave Pay Rate:** 80%
- **Working Days in the Month:** 23
- **Paid Leave Days:** 10 (Calculated based on system configuration for weekends)
- **Days Worked:** 13

### 💰 Payroll Calculation

#### 🧮 Daily Rate Calculation
- **Daily Rate:** $30 ÷ 23 = **$1.3043**

#### 💼 Regular Pay
- **13 Days × $1.3043 = $16.96**

#### 🏖️ Leave Pay (80%)
- **10 Days × $1.3043 × 0.8 = $10.43**

#### 📊 Recalculated Base Salary
- **$16.96 + $10.43 = $27.39**

---

### 🪙 Allowances & Benefits

#### 🏆 Seniority Bonus
- **$27.39 × 3 years × 0.035 = $2.88**

#### 🏠 Housing Allowance (30%)
- **$27.39 × 0.3 = $8.22**

#### 🚌 Transport Allowance
- **$40.00**

#### 📚 Education Fees:**
- **$0.00**

#### 🧾 High Cost of Living Indemnity
- **$5.00**

#### 💼 Bonuses
- **$0.00**

---

### 💵 Taxable & Non-Taxable Breakdown

#### 🔖 Taxable Benefits
| Component                    | Amount |
|-----------------------------|--------|
| Seniority Bonus             | $3.15  |
| High Cost of Living         | $5.00  |
| **Total Taxable**           | **$8.15** |

#### 🏠 Non-Taxable Benefits
| Component                  | Amount  |
|---------------------------|---------|
| Housing (30%)             | $8.22   |
| Transport                 | $40.00  |
| **Total Non-Taxable**     | **$48.22** |

---

### 🧾 Salary Summary

| Category               | Amount     |
|------------------------|------------|
| Base Salary            | $27.39     |
| Net Taxable            | $7.88      |
| Net Non-Taxable        | $48.22     |
| **Gross Salary**       | **$83.48** |

---

### 📉 Deductions

#### 🚫 Advance on Salary
- **$0.00**

#### 🛡️ INSS (Social Security - Employee Share 3.5%)  
- **Base: $27.39 + $7.88 = $35.27**
- **INSS QPO 3.5% = $1.23**

#### 🛡️ INSS QPP (Pension Plan - 5%)  
- **5% of $35.27 = $1.76** *(Not deducted from Gross Salary)*

#### 🧮 Tax Base (IPR Calculation)
- **$35.27 - $1.23 = $34.03**
- **Exchange Rate: 1 USD = 930 CDF**
- **IPR Base: $34.03 × 930 = 31,650.72 CDF**
- **Annualized: 31,650.72 × 12 = 379,808.64 CDF**

#### 🧾 IPR Tax Bracket Evaluation
- **Bracket: 0 – 524,160 CDF → 0%**
- **IPR Tax: 379,808.64 × 0% = 0 CDF**

---

### 💸 Final Deductions Summary
| Deduction                            | Amount |
|-------------------------------------|--------|
| Salary Advance                      | $0.00  |
| INSS QPO (3.5%)                     | $1.23  |
| IPR Tax                             | $0.00  |
| **Total Deductions**                | **$1.23** |

---

### 🧾 Final Take-Home Pay
- **Net Salary:** $83.49 - $1.23 = **$82.26**

