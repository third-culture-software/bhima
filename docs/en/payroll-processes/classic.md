# Scenario Descriptions for Payroll Processes
# Scenario Analysis for Payroll Calculation in the Classic System

For the classic payroll system, we will use the payroll period PAYROLL KEY DELIVERABLE 4, which spans from January 1st to January 31st, 2025. In this analysis, we will review the various configurations that make up this payroll period, in order to understand the parameters used for calculating employee salaries.

Scenario Context:
 + **Payroll Period** : January 1st, 2025 to January 31st, 2025.

 + **System Used** : Classic payroll management system.

 + **Objective** : Identify and analyze the configurations needed to accurately calculate employee payroll during this specific period.

# Payroll Employees Configuration
### Employee Setup for the Payroll Period

---

**As part of this configuration, we used the employee configuration CONFIG KEY DELIVERABLE 4 to define the necessary parameters. We selected a total of 74 employees for this payroll period, but we will focus more specifically on the following employees:**

- **Amelia Rose Thornton**
- **Ethan James Caldwell**
- **Harper Elise Whitmore**
- **Olivier Benjamin Hensley**

These employees were selected for this analysis in order to verify that their data is correctly taken into account and processed according to the configurations defined in the payroll system.

---

### Employee Configuration for Payroll Period

In this configuration, we used the **employee configuration CONFIG KEY DELIVERABLE 4** to set the necessary parameters. A total of **74 employees** were selected for this payroll period, but we will specifically focus on the following employees:

- **Amelia Rose Thornton**
- **Ethan James Caldwell**
- **Harper Elise Whitmore**
- **Olivier Benjamin Hensley**

These employees were selected for this analysis to ensure that their data is correctly handled and processed according to the configurations set in the payroll system.

### Payroll Rubric Configuration

---

### Payroll Item Configuration

For this payroll period, we used the standard configuration titled **Payroll Item Configuration**. This setup includes several items related to **social charges**, which represent **non-taxable benefits**.

#### Social charge items used:

- **FAMILY ALLOWANCES** 👨‍👩‍👧‍👦  
- **IN-KIND BENEFIT – HOUSING** 🏠  
- **TRANSPORT** 🚌

These items must be configured carefully, as they directly impact the net salary calculation without being subject to income tax. They represent forms of benefits granted to employees, often defined by the organization's internal policy or applicable legal regulations.

---

### Payroll Rubric Configuration

For this payroll period, we used the classic configuration titled **Payroll Rubrics Configuration**. This setup includes several rubrics related to **social charges**, which are considered **non-taxable benefits**.

#### Social Charges Rubrics Included:

- **FAMILY ALLOWANCES** : (ALLOCATIONS FAMILIALES)
- **IN-KIND BENEFIT – HOUSING** : (AVANTAGE EN NATURE – LOGEMENT)  
- **TRANSPORTATION** : (TRANSPORT)

These rubrics must be carefully configured, as they directly impact the net salary without being subject to income tax. They represent types of employee benefits, often defined by internal company policies or applicable labor regulations.

---

💡 **Note / Remark**   
> When configuring these rubrics, it is crucial to specify their *non-taxable* status in the system so that payroll calculations comply with local tax laws.

---

### 🧾 Social Charge Rubric: **IN-KIND BENEFIT – HOUSING**

In the payroll configuration, **social charges** are considered **non-taxable benefits**. These rubrics are designed to provide indirect compensation to employees without increasing their taxable income.

#### ⚙️ Configuration Properties

- **Rubric Type**: Index  
- **Monetary Value**: Yes  
- **Is it an Addition?**: Yes  
- **Taxable**: No (Non-taxable)   

The **housing benefit** rubric is configured as a percentage-based index. Specifically, the system calculates the housing allowance as **30% of the base salary**, and this value is automatically added to the employee’s gross pay without affecting the taxable portion.

---


This rubric:
- Enhances employee benefits transparently.
- Automatically scales with salary changes due to its percentage-based configuration.
- Requires accurate classification in the system to avoid compliance issues.

> ✅ **Best Practice**  
> When configuring this rubric, ensure that it is clearly flagged as *non-taxable* and that its percentage rule (30%) is properly mapped in the payroll engine logic.


### Membership fee


### 🧾 Social Contribution Rubrics: **COTISATION INSS QPO (SOCIAL SECURITY)** & **COTISATION INSS QPP (RETIREMENT PENSION)**

In the payroll configuration, **social contributions** are categorized into two types based on who bears the cost: the employee or the employer. These contributions are generally defined as **percentages** of the taxable base.

#### ⚙️ Contribution Types

1. **COTISATION INSS QPO (SOCIAL SECURITY)**   
   This contribution is the employee's share (employee-paid).

2. **COTISATION INSS QPP (RETIREMENT PENSION)**  
   This contribution is the employer's share (employer-paid).

Both of these contributions are essential components in the calculation of **social security and pension payments**, ensuring the well-being of employees after their retirement and during illness or disability.

---

### ⚙️ Configuration Properties for Both Contributions

- **This rubric is an index**: Yes  
- **This rubric is a monetary value**: Yes  
- **This rubric is expressed in percentage**: Yes  
- **Is it a deduction**: Yes  
- **Is it a membership fee**: Yes  

---

### 🔍 Contribution Breakdown

- **COTISATION INSS QPO** (Social Security): This contribution is **paid by the employee** as part of the worker's personal share (QPO).
- **COTISATION INSS QPP** (Retirement Pension): This contribution is **paid by the enterprise** as part of the employer's share (QPP).

---

### 💡 Why It Matters

Social contributions are a crucial part of an employee’s benefits package and compliance with local regulations. By ensuring that these contributions are configured correctly:

- **Employees** contribute their share to social security and retirement pensions (QPO).
- **Employers** contribute to pension funds (QPP).
- Contributions are deducted directly from the payroll, calculated automatically as a percentage of the employee's taxable base.

> ✅ **Best Practice**  
> Ensure that both the employee and employer contributions are correctly configured, with appropriate percentage rates and deductions for each category, to avoid payroll discrepancies and ensure compliance.

---

### Tax Rubrics

---

### 🧾 Tax Rubrics and Salary Deductions

In the payroll system, **taxes** are classified into two main categories based on who bears the financial responsibility: the **employee** or the **employer**.

---

### 📌 1. Employee-Paid Tax: **Professional Income Tax (IPR)**

The **IMPÔT PROFESSIONNEL SUR LE REVENU (IPR)** represents the primary tax deducted directly from an employee’s gross taxable salary.

#### ⚙️ Configuration Properties

- **Rubric Type**: Index  
- **Monetary Value**: Yes  
- **Is it a Deduction?**: Yes  
- **Is it a Tax?**: Yes  
- **Is it IPR?**: Yes  
- **Paid by**: Staff  

#### 🧠 Special Note on IPR Calculation Logic

Once a rubric is flagged as **IPR**, a **dedicated algorithm is automatically triggered** by the system to perform the tax calculation. The algorithm uses the following formula:

> **IPR Base** = Base Salary + All Taxable Benefits – INSS Employee Share (QPO)

This ensures that only the net taxable income is used to compute the IPR, adhering to national regulations on salary taxation.

---

### 📌 2. Employer-Paid Taxes

These are mandatory contributions paid **entirely by the employer**, calculated based on the base salary of each employee.

#### ⚙️ Included Rubrics:

- **COTISATION ONEM** *(National Employment Office)*  
- **INSTITUT NATIONAL DES PRATIQUES PROFESSIONNELLES (INPP)**

#### Configuration Properties (for both rubrics)

- **Rubric Type**: Index  
- **Monetary Value**: Yes  
- **Is it a Percentage?**: Yes  
- **Is it a Deduction?**: Yes  
- **Is it a Tax?**: Yes  
- **Paid by**: Enterprise  

These rubrics represent employer obligations in supporting national employment and professional development programs. Although **they are not deducted from employee pay**, they are crucial for payroll reporting and cost accounting.

---

### 💡 Key Considerations

- Always **distinguish clearly** between employee-paid and employer-paid taxes in payroll reports.
- Ensure that **IPR rubrics are accurately flagged** so that the correct tax logic is applied.
- Percent-based rubrics must have **fixed, system-recognized rates**, and should be **linked to the employee's base salary**.

> ✅ **Best Practice**  
> Use naming conventions like `IPR_EMPLOYEE`, `ONEM_EMPLOYER`, and `INPP_EMPLOYER` in the system for clarity and accurate reporting.

---

---

### 🧾 Other Payroll Rubrics: Deductions and Benefits

In addition to standard taxes and social contributions, the payroll system includes various **other rubrics**, categorized as either **salary deductions** or **employee benefits**. These rubrics enhance the flexibility of the payroll engine and reflect internal company policies and specific contractual agreements.

---

### 📌 1. Deductions (Retenues)

These are amounts subtracted from the employee’s salary, often related to personal financial obligations or internal company commitments.

#### ⚙️ Common Deduction Rubrics

- **Salary Advances**  
- **Salary Installments (Acomptes)**  
- **Internal Company Contributions**

## 💸 Advances and Salary Advances

Advances and salary prepayments help to settle the situation of an employee who has benefited from either an **advance** or a **prepayment** on their salary (by debiting the employee's balance). The salary deduction operation should be accompanied by a transaction that **credits** the employee's account.

---

### 🔧 Configuration for Employee-Related Items
To configure the items that should be linked to the employee, you need to **check the option**:  
**"Will be associated with the employee ID"**

---

➡️ This ensures that any deductions or advances on salary are properly tied to the employee’s account for accurate tracking and payment reconciliation.


#### Configuration Properties (for deductions)

- **This rubric is an index**: Yes  
- **This rubric is a monetary value**: Yes  
- **Is it a deduction?**: Yes  
- **Is it a tax?**: No (usually non-taxable unless contractually specified)  

> 💬 *Comment*: Deductions like advances and internal contributions are useful for managing loans, social welfare funds, or other internal programs. These should be well-documented and transparent to both payroll staff and the employee.

---

### 📌 2. Benefits (Avantages)

These rubrics represent **additional income or perks** provided to employees. They may be taxable or non-taxable, depending on the country's tax code and how the rubric is configured.

#### ⚙️ Common Benefit Rubrics

- **School Fees (FRAIS SCOLARITÉ)**  
- **Cost-of-Living Allowance (INDEMNITÉ VIE CHÈRE)**  
- **Performance Bonuses (PRIMES)**  
- **Seniority Bonus (PRIME D'ANCIENNETÉ)**

#### Configuration Properties (for benefits)

- **This rubric is an index**: Yes  
- **This rubric is a monetary value**: Yes  
- **Is it an addition?**: Yes  
- **Taxable?**: Depending on national tax rules and rubric settings  

> 💡 *Best Practice*: Always define whether the benefit is taxable or not during rubric setup. Taxable benefits must be included in the **IPR base** if applicable.

---

### 💼 Payroll Account Configuration

In the payroll system, the **account configuration** is a critical step in setting up the accounting logic for payroll transactions.

#### 📘 Example: Expense Account Configuration

The account **`[66110011] - Rémunération Personnel`** is used to define the **expense account** that will be debited when generating the accounting entry for salary processing.

> 🧾 **Purpose**: This ensures that staff salaries are correctly recorded as operational expenses in the organization’s financial statements.

#### 🔧 Configuration Notes

- **Account Code**: `66110011`  
- **Account Type**: Expense (Charges)  
- **Usage**: Used when generating accounting entries during payroll posting  
- **Linked To**: Salary Payment (gross or net depending on setup)  

> 💬 *Comment*: It is crucial to align the payroll system’s chart of accounts with the organization’s general accounting plan. This allows seamless integration between HR/payroll operations and financial reporting.

---

### 📊 IPR Tax Bracket Configuration

The payroll system supports the configuration of multiple **IPR (Professional Income Tax)** brackets to accommodate different legal and fiscal frameworks.

For this payroll scenario, we are using the **2013 tax bracket** as the official reference for IPR calculations.

#### ⚙️ Key Properties:

- **Bracket Type**: IPR – Income Tax  
- **Version Used**: 2013  
- **Status**: Active  
- **Applies To**: Taxable base (Basic Salary + Taxable Benefits − Employee INSS contribution)  

> 💡 *Comment*: The system automatically applies the correct algorithm for IPR calculation once the rubric is flagged as "IPR". Make sure to verify the legal accuracy of the configured tax brackets regularly.

---

### 📆 Weekend Configuration

In this scenario, the **Configuration Semaine Anglaise** was selected for determining workdays within the payroll period.

Under this configuration:

- **Saturday** and **Sunday** are not considered working days.  
- The payroll period of **January 2025** includes **23 working days**.

#### 🔧 Settings Summary:

- **Week Configuration Name**: English Week  
- **Non-working Days**: Saturday, Sunday  
- **Working Days in Period (Jan 2025)**: 23  

> 📌 *Note*: This weekend configuration is essential for calculating daily rates and adjusting monthly salaries, especially for hourly workers or in case of absences.

---

## 📌 Scenario 1: Payroll Simulation for Employee — *Amelia Rose Thornton*

This scenario illustrates how payroll is calculated for a long-serving employee, **Amelia Rose Thornton**, using the configured rules in the classic payroll system.

### 👩 Employee Profile

- **Name**: Amelia Rose Thornton  
- **Date of Birth**: September 20, 1963  
- **Date of Hire**: January 1, 1983  
- **Seniority**: 42 years of service as of January 2025  

### 📅 Payroll Period

- **Period**: January 1 – January 31, 2025  
- **Working Days**: 23 (based on English Week configuration)  
- **Days Worked**: 23 days  

---

### 📐 Seniority Bonus Calculation

The **Seniority Bonus** (*Prime d'ancienneté*) is calculated using the following formula:

```txt
Seniority Bonus = Basic Salary × Years of Service × Seniority Index
```

> 🔧 *Note*: The seniority index must be configured in the system prior to payroll calculation.

---

### 💳 Fixed Allowances & Deductions

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
| **🔻 Total Deductions**                  | **$100.09** |

---

## 💸 Net Salary Calculation

- **Gross Salary**: `$725.50`  
- **Deductions**: `$100.09`  
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
| Seniority Bonus             | $2.88  |
| High Cost of Living         | $5.00  |
| **Total Taxable**           | **$7.88** |

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

