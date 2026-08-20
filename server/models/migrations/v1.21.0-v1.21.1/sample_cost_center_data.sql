INSERT INTO cost_center (id, label, is_principal, project_id, allocation_method, allocation_basis_id, step_order) VALUES
(10, 'Accounting', 0, NULL, 'proportional', 3, 3),
(11, 'Daycare Facility', 0, NULL, 'proportional', 1, 0),
(12, 'IT', 0, NULL, 'proportional', 2, 2),
(13, 'HR', 0, NULL, 'proportional', 1, 1),
(14, 'Cutting', 1, NULL, 'proportional', NULL, 4),
(15, 'Assembling', 1, NULL, 'proportional', NULL, 5),
(16, 'Packaging', 1, NULL, 'proportional', NULL, 6);

INSERT INTO cost_center_allocation_basis_value (id, quantity, cost_center_id, basis_id) VALUES
(22, 8.0000, 10, 1),
(23, 5.0000, 11, 1),
(24, 9.0000, 12, 1),
(25, 4.0000, 13, 1),
(26, 20.0000, 14, 1),
(27, 50.0000, 15, 1),
(28, 5.0000, 16, 1),
(29, 10.0000, 10, 2),
(30, 2.0000, 11, 2),
(31, 10.0000, 12, 2),
(32, 5.0000, 13, 2),
(33, 6.0000, 14, 2),
(34, 4.0000, 15, 2),
(35, 8.0000, 16, 2),
(36, 250000.0000, 10, 3),
(37, 50000.0000, 11, 3),
(38, 200000.0000, 12, 3),
(39, 300000.0000, 13, 3),
(40, 500000.0000, 14, 3),
(41, 700000.0000, 15, 3),
(42, 400000.0000, 16, 3);

INSERT INTO cost_center_aggregate (period_id, debit, credit, cost_center_id) VALUES
(202108, 250000.0000, 0.0000, 10),
(202108, 50000.0000, 0.0000, 11),
(202108, 200000.0000, 0.0000, 12),
(202108, 300000.0000, 0.0000, 13),
(202108, 500000.0000, 0.0000, 14),
(202108, 700000.0000, 0.0000, 15),
(202108, 400000.0000, 0.0000, 16);
