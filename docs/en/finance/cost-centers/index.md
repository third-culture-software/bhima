# Cost Centers

## Hospital Finances

In order for a hospital to operate successfully over time, the managers must
have a clear understanding of whether the hospital is taking in enough money
to cover its costs.  If not, the hospital management needs to take corrective
actions.  That requires the financial manager to understand the income of the
hospital as well as the costs that the hospital incurs during is operations.

In a hospital or clinic there are usually several services or departments that
perform services for patients or to support the operations of the hospital. We
also call these **centers** in BHIMA.  For example, some typical departments
are Administration, Surgery, Pharmacy, Maintenance, etc.

Larger hospitals might have all of these departments (or more).  A rural
clinic would probably have fewer departments since they offer fewer services.

While aggregate totals of income and costs for the whole hospital have value
in the financial analysis of the hospital, it is more important to have a
granular understanding of the costs for each department as well as the income
of each department.  Then the hospital manager can make decisions about
reducing the costs of specific department and modifying the prices of the
services the hospital offers to make the operation of the hospital sustainable
over the long run.

The BHIMA software supports these types of financial analysis:

1. [Cost Center Cost Analysis](#cost-center-cost-analysis) -

   - [Basics of cost allocation using the *step-Down* Approach](#cost-center-cost-analysis) <br>
     Determine the total cost to operate each department using the
     "step-down" cost allocation technique.

   - [Implementing *step-down* cost allocation analysis in BHIMA](./bhima-step-down-cost-analysis.md) <br>
     Demonstrate how to set up and perform *step-down* cost allocation analysis in BHIMA.

2. Break-Even Analysis (TBD)


## Cost Center Cost Analysis

### Operational Costs

When we consider the operating costs of individual departments or **centers**,
we must consider the **direct** costs and the **indirect** costs.

- **direct costs** - are costs that are directly link-able to a specific
    department of the hospital.  For example, this would include salaries for
    the personnel of the department, purchases specifically for the
    department, and other operational costs specific to the department.

- **indirect costs** - are costs that are required for the department to
    operate but are not explicitly charged to the department.  Examples of
    **indirect costs** include hospital-wide "overhead" services such as
    hospital administration and maintenance.

We also use similar terms to distinguish departments based on whether they
provide services or goods directly to patients or outside entities.

- **direct departments** - are departments which offer services or sell
    goods to patients or other organizations.  These are also called
    **revenue** or **profit** departments (or *centers*).

- **indirect departments** - are departments which provide services or goods
    to other departments of the hospital but not directly to patients or other
    organizations.  These are also called **Non-revenue** or **service**
    departments (or *centers*).

Based on these definitions, we can now classify various typical hospital
departments (cost centers):

| Cost Center     | Revenue?                  |
|-----------------|---------------------------|
| Administration  | Non-revenue / indirect    |
| Emergency Room  | Revenue / direct / profit |
| Dental          | Revenue / direct / profit |
| Facilities      | Non-revenue / indirect    |
| Housekeeping    | Non-revenue / indirect    |
| Human Resources | Non-revenue / indirect    |
| IT (Information Technology) | Non-revenue / indirect |
| Laundry         | Non-revenue / indirect    |
| Maintenance     | Non-revenue / indirect    |
| Nursing         | Non-revenue / indirect    |
| Obstetrics      | Revenue / direct / profit |
| Ophthalmology   | Revenue / direct / profit |
| Pathology       | Revenue / direct / profit |
| Pediatrics      | Revenue / direct / profit |
| Pharmacy        | Revenue / direct / profit |
| Radiology       | Revenue / direct / profit |
| Surgery         | Revenue / direct / profit |
| Transportation  | Non-revenue / indirect    |

Note that the concept of a *cost center* is potentially broader than a
department.  It might be useful to combine more than one department into a
cost center.  For instance, it might make sense to consider Surgery and Dental
as a combined cost center.

### Cost Allocations

One of the questions that we will address with the BHIMA software is how to
allocate (or divide) the *indirect costs* to specific departments (*centers*)
in order to determine the the actual, overall cost to operate each department.

In order to allocate costs to departments, it is necessary to chose an
**allocation basis**.  For instance, the costs of administration are often
allocated to specific cost centers (departments) based on the number of
employees in the department.  For various indirect costs there is often more
than one possibility for an *allocation basis*.  For maintenance, it might
make sense to allocate maintenance costs to departments based on the number of
the number of machines in the department, the area of the space occupied by
the department, or the total cost of machinery in the department.  Choosing an
appropriate *allocation basis* is important.

In general, we would like to allocate the costs of all *indirect departments*
to the *direct departments* so we have clear understanding of the total cost
for each *direct department*.

In the BHIMA software we provide a way to allocate indirect costs using the
**Step Down** cost allocation method.  This process works by sequentially
allocating the costs of each *indirect department* to the rest of the
succeeding *indirect departments* and *direct departments* until all of the
costs of *indirect departments* have been allocated (distributed) to the
*direct departments*.  During each step, the costs for the department being
distributed are allocated on the basis of the *allocation basis* chosen for
that cost center.  A simplified example will help clarify this.

#### Step-Down Cost Allocation Example

Suppose we have a small hospital or clinic with administration, housekeeping,
laundry, surgery, and pharmacy.  In "surgery" we are considering all the
medical staff and the services that they perform.  Here is some information
about these departments over a set period:

| Department     | Direct Costs | Num Employees | Area (m<sup>2</sup>) | Washed (kg) |
|----------------|--------------|---------------|----------------------|-------------|
| Surgery        |       $40000 |             4 |                  100 |          40 |
| Pharmacy       |      $100000 |             2 |                  100 |          20 |
| Administration |       $20000 |             2 |                  100 |          20 |
| Housekeeping   |        $5000 |             2 |                   50 |           5 |
| Laundry        |        $7000 |             2 |                   50 |           5 |

Our goal is to distribute the overhead costs of the Administration and
Housekeeping to the revenue departments (Surgery and Pharmacy) to better
understand the total of direct and indirect costs for the revenue departments.

These numbers are artificial and unrealistic, but serve to show the
computations involved in determine overhead costs for revenue departments
using the *step down* approach.

First we need to pick what allocation basis should be used for distributing
the costs of the non-revenue departments. Here is one possible choice:

- Administration - Number of employees
- Housekeeping - Area
- Laundry - Amount washed (kg)

In the *step-down* cost allocation process, the order of how the departments
are distributed must be chosen appropriately.  In general, the departments
that should be processed first are the ones that receive the least amounts of
services from other departments.  In this example, this would probably be
either Housekeeping or Laundry.  We will start with Laundry.

For the Laundry department, we will allocate costs to other departments based
on the amount of clothes washed.  The total direct cost for the Laundry
service is $7000.  Based on the table, 85 kg of laundry were washed (for other
departments) during the period.  So we would distribute the laundry costs as
follows:

| Department     | Old Cost | Washed (kg) | Distribution            | New Cost |
|----------------|----------|-------------|-------------------------|----------|
| Laundry        |    $7000 |           5 |                         |          |
| Housekeeping   |    $5000 |           5 | $7000 * (5/85)  =  $412 |   $5412  |
| Administration |   $20000 |          20 | $7000 * (20/85) = $1647 |  $21647  |
| Surgery        |   $40000 |          40 | $7000 * (40/85) = $3294 |  $43294  |
| Pharmacy       |  $100000 |          20 | $7000 * (20/85) = $1647 | $101647  |
|                |          |             |                         |          |
| Total          |  $172000 |          90 |                         | $172000  |

The following table shows the *step down* process repeated for each department
in order.  Note that when we distribute all of the non-revenue departments,
the process stops and the resulting totals for the revenue departments show
the combined direct plus indirect costs.

| Department     | Direct Cost | Laundry (kg) | Housekeeping (area) | Administration (#emp) | Total   |
|----------------|-------------|--------------|---------------------|-----------------------|---------|
| Laundry        |       $7000 |            0 |                     |                       |         |
| Housekeeping   |       $5000 |         $412 |                     |                       |         |
| Administration |      $20000 |        $1647 |               $1803 |                       |         |
| Surgery        |      $40000 |        $3294 |               $1803 |                $15634 |  $60732 |
| Pharmacy       |     $100000 |        $1647 |               $1803 |                 $7817 | $111268 |
|                |             |              |                     |                       |         |
| Total          |     $172000 |        $7000 |               $5412 |                $23451 | $172000 |

From this analysis, we can see that the Surgery has $20,732 of indirect costs
and that the Pharmacy has $11,268 of indirect costs.

If we had chosen to process the Housekeeping first, the results would be a
little different.  Furthermore, if we had chosen a different allocation basis
for any of the non-revenue departments, that would also change the results.
So it is important to chose allocation bases that best represent the cost
drivers for those departments.  As long as the choices for allocation bases
and step-down order are reasonable, the results will probably be similar and
will be useful for financial planning.

Visit [*step-down* cost allocation analysis in BHIMA](./bhima-step-down-cost-analysis.md)
For details on how to set up and perform *step-down* cost analysis in BHIMA.


