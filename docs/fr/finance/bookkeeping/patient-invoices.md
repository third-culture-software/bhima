# Facturation du patient

BHIMA propose un module de facturation patient simple, puissant et flexible. Les patients sont facturés pour des biens et services dans le [inventaire](#). Au moment de la facturation, le prix des articles individuels est calculé à partir du prix de base de l'inventaire et des listes de prix éventuellement applicables au patient.

En outre, des frais supplémentaires, connus sous le nom de [Facture](#), ou une réduction supplémentaire, appelée [Subvention](#), peuvent être appliqués au moment de la facturation en fonction du débiteur ou du groupe de patients du patient. Pris ensemble, ceux-ci permettent à une institution de modéliser une série de scénarios de facturation complexes.

## Prix des articles de facture

Si une liste de prix existe, les prix figurant sur cette liste remplaceront toujours le prix de stock. Cependant, le système cherche à appliquer le prix le plus bas possible pour un article donné - si plusieurs listes de prix s'appliquent au patient, les articles assumeront leur prix le plus bas possible dans toutes les listes de prix \(vous devez vérifier que c'est le cas\).