# Corriger et revalider tout le back-office administrateur

## Objectif
Corriger les anomalies relevées dans le dernier audit, refaire une vérification complète de toutes les pages administrateur et livrer un nouveau guide PDF français où chaque capture précise les fonctionnalités couvertes.

## Corrections prévues
- Limiter la file « Validation des annonces » aux annonces réellement soumises à validation, sans brouillons.
- Traduire en français les derniers textes visibles en anglais : statuts de réservation et paiement, motifs d’annulation, notifications, catalogue, pages éditoriales, fiche membre et message de confidentialité des conversations.
- Clarifier les écrans financiers multidevises en séparant ou identifiant explicitement chaque devise, sans additionner EUR et USD.
- Corriger les états de chargement persistants du tableau de bord et de la fiche membre, avec message d’erreur et bouton de nouvelle tentative lorsque nécessaire.
- Éviter les requêtes d’avatar inutiles lorsqu’aucune photo n’existe et conserver les initiales comme solution de remplacement.
- Rendre l’état des e-mails explicite et sûr : commandes désactivées tant que le mot de passe de boîte manque, avec indication précise de la configuration requise.

## Vérification complète
- Se connecter avec le compte administrateur fourni.
- Parcourir les 22 rubriques, les pages de détail membre et annonce, ainsi que le menu mobile.
- Ouvrir et vérifier tous les dialogues : refus, réservation, facture, créations et modifications du catalogue, confirmations et réglages.
- Tester sans risque les recherches, filtres, pagination, exportations et validations de formulaires.
- Ne confirmer aucune suppression, suspension, approbation, remboursement, versement ou modification réelle de données.
- Contrôler les erreurs visibles, les requêtes réseau et l’affichage sur ordinateur et mobile.

## Nouveau PDF
- Produire une nouvelle version française, distincte du PDF précédent.
- Consacrer une page à chaque capture avec : objectif de l’écran, fonctionnalités couvertes, actions testées, résultat et limite éventuelle.
- Ajouter une synthèse avant/après et une matrice finale de couverture.
- Convertir et inspecter visuellement toutes les pages avant livraison.

## Point externe
La configuration du mot de passe de la boîte e-mail dépend toujours d’un secret serveur fourni par le propriétaire. L’interface sera corrigée pour l’expliquer et empêcher les actions vouées à échouer, mais l’envoi réel ne pourra être validé sans ce secret.
