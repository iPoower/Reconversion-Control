"use strict";
/* Compléments originaux, indépendants des PDF Race Control historiques.
   Références publiques indiquées pour chaque thème ; pas de reproduction d'ouvrage privé. */
const RC_DEEP_DIVES = {
 "linux-fs": {
   label:"Linux · système de fichiers", objectives:["Distinguer chemin absolu et relatif","Retrouver un fichier par son nom puis son contenu","Identifier les répertoires système sans y écrire"], 
   theory:["Sous Linux, / est la racine. /etc contient principalement des configurations, /var des données variables (dont des journaux), /home les espaces utilisateurs. Le répertoire courant est donné par pwd ; un chemin commençant par / est absolu.","find recherche des entrées dans une arborescence ; grep recherche du texte dans des fichiers. Les combiner permet de diagnostiquer une configuration sans connaître d'avance sa localisation.","Travailler dans un dossier d'essai évite de modifier par inadvertance une configuration système. Pour diagnostiquer, commencer par des commandes de lecture."],
   command:"pwd\nmkdir -p ~/rc-lab/config ~/rc-lab/logs\nprintf 'mode=training\\n' > ~/rc-lab/config/app.conf\nfind ~/rc-lab -type f -name '*.conf'\ngrep -n 'mode' ~/rc-lab/config/app.conf",
   challenge:"Explique pourquoi find et grep ne renvoient pas le même type de résultat. Identifie le chemin absolu de app.conf et donne une commande qui n'écrit rien.",
   pitfalls:["Ne pas lancer find / sans anticiper les erreurs de permissions et la durée","Ne pas confondre fichier de configuration et service actif."],
   source:["Linux man-pages · find", "https://man7.org/linux/man-pages/man1/find.1.html"]
 },
 "linux-perms": {
   label:"Linux · permissions et moindre privilège", objectives:["Lire rwx sur utilisateur/groupe/autres","Interpréter chmod 600 et chmod 640","Séparer permissions POSIX et droits sudo"],
   theory:["Les neuf bits rwx s'appliquent séparément au propriétaire, au groupe et aux autres. Lecture vaut 4, écriture 2 et exécution 1 : 600 signifie lecture/écriture pour le propriétaire, aucun droit pour les autres catégories.","Pour un dossier, le bit x permet la traversée ; sans lui, l'accès aux fichiers internes peut être impossible même si leur nom est connu.","sudo change le contexte de privilèges d'une commande. Il ne corrige pas le modèle d'autorisation : pour un fichier de lab personnel, préférez les permissions minimales et évitez root."],
   command:"mkdir -p ~/rc-lab\nprintf 'demo\\n' > ~/rc-lab/secret.txt\nchmod 600 ~/rc-lab/secret.txt\nls -l ~/rc-lab/secret.txt\nstat -c '%a %U:%G' ~/rc-lab/secret.txt",
   challenge:"Un fichier 640 est lisible par son groupe. Pourquoi 777 serait-il dangereux pour une clé privée ? Décris les droits en termes d'acteurs et d'actions.",
   pitfalls:["chmod ne règle pas toutes les ACL ou politiques SELinux","Ne pas coller de véritables clés privées dans le lab."],
   source:["GNU Coreutils · File permissions", "https://www.gnu.org/software/coreutils/manual/html_node/File-permissions.html"]
 },
 "linux-process": {
   label:"Linux · processus, services et journaux", objectives:["Différencier processus et service","Lire l'état d'un service systemd","Rechercher des erreurs horodatées dans un journal"],
   theory:["Un processus est une instance d'exécution avec un PID. Un service systemd est une unité dont le cycle de vie est géré par le système : son état et ses logs ne se déduisent pas uniquement de la présence d'un PID.","systemctl status montre l'état opérationnel et parfois les dernières lignes du journal. journalctl -u permet de consulter l'historique d'une unité. L'horodatage et le code d'erreur doivent être conservés dans le diagnostic.","Une démarche reproductible commence par observer : état, journal, configuration, dépendances. Redémarrer en premier peut effacer les symptômes utiles."],
   command:"systemctl --no-pager status ssh\njournalctl --no-pager -u ssh -n 30\nps -ef | head\nss -lnt",
   challenge:"Simule un ticket « le service est arrêté ». Quelles observations distinguent une mauvaise configuration d'un port déjà utilisé ?",
   pitfalls:["Le nom de l'unité peut être sshd plutôt que ssh","Une sortie d'exemple ne constitue pas une preuve sur ta machine."],
   source:["systemd · journalctl", "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html"]
 },
 "ipv4": {
   label:"Réseau · IPv4 et CIDR", objectives:["Lire une adresse et un préfixe","Calculer réseau et broadcast","Vérifier si deux IP appartiennent au même sous-réseau"],
   theory:["Un préfixe /24 signifie 24 bits de réseau et 8 bits hôte. Dans un sous-réseau classique 192.168.10.0/24, la plage va de 192.168.10.0 à 192.168.10.255 ; dans le modèle de sous-réseau broadcast, les adresses .0 et .255 ont des rôles réservés.","Le masque /26 regroupe 64 adresses consécutives : .0–.63, .64–.127, etc. Le réseau est obtenu avec un ET binaire entre IP et masque.","Attention aux /31 et /32, qui ont des conventions d'usage particulières : ne pas appliquer systématiquement la formule de deux adresses réservées."],
   command:"ip -4 addr\nip route\n# Exercice papier : 192.168.10.70/26 → réseau .64, broadcast .127",
   challenge:"Déduis le réseau et le broadcast de 10.2.5.130/27, puis explique les 32 adresses du bloc.",
   pitfalls:["Le premier octet ne suffit jamais à déduire le préfixe","Un réseau local réel ne correspond pas toujours au masque historique /24."],
   source:["RFC 4632 · CIDR", "https://www.rfc-editor.org/rfc/rfc4632"]
 },
 "routing": {
   label:"Réseau · routage et passerelle", objectives:["Distinguer destination, next hop et interface","Lire une route par défaut","Comprendre la règle du préfixe le plus spécifique"],
   theory:["La table de routage détermine où envoyer un paquet selon sa destination. Une route locale connectée envoie directement au réseau associé ; une route via indique une passerelle ou prochain saut.","Lorsqu'il existe plusieurs routes, une route avec le préfixe le plus spécifique est préférée. La route par défaut 0.0.0.0/0 ne s'applique que lorsqu'aucune autre route ne correspond mieux.","Le DNS traduit les noms mais ne décide pas de la route réseau. Si 1.1.1.1 répond mais pas un nom de domaine, il faut distinguer panne DNS de panne de routage."],
   command:"ip -4 route show\nip route get 1.1.1.1\n# Lecture seule : aucune modification de table de routage",
   challenge:"Pour 10.0.0.42, entre 0.0.0.0/0 et 10.0.0.0/24, quelle route gagne ? Pourquoi ?",
   pitfalls:["N'ajoute pas de route sur ton poste professionnel sans autorisation","Un ping qui échoue peut provenir d'un filtrage ICMP, pas d'une route absente."],
   source:["Linux ip-route(8)", "https://man7.org/linux/man-pages/man8/ip-route.8.html"]
 },
 "dns": {
   label:"Réseau · résolution DNS", objectives:["Distinguer nom, enregistrement et adresse","Repérer un cache DNS","Séparer DNS, TLS et HTTP"],
   theory:["Un résolveur transforme un nom en informations DNS : A pour IPv4, AAAA pour IPv6, MX pour le courrier. Un CNAME est un alias vers un autre nom ; il ne garantit pas à lui seul qu'une connexion HTTP fonctionnera.","Les réponses peuvent être conservées en cache pendant leur TTL. Une modification DNS peut donc sembler intermittente entre différents résolveurs et appareils.","Une résolution réussie n'atteste pas que le serveur accepte TLS ni qu'une application HTTP répond. Diagnostiquer sépare chaque couche : DNS → TCP → TLS → HTTP."],
   command:"nslookup example.com\ndig example.com A\ndig example.com AAAA\ncurl -I https://example.com",
   challenge:"Une IP directe répond, mais example.com échoue. Propose trois tests avant de modifier quoi que ce soit.",
   pitfalls:["Ne pas confondre un code HTTP 404 et une panne DNS","Le cache explique parfois des écarts légitimes sans prouver une compromission."],
   source:["Cloudflare · DNS records", "https://www.cloudflare.com/learning/dns/dns-records/"]
 },
 "shared": {
   label:"Cloud · responsabilité partagée", objectives:["Délimiter qui protège quoi","Distinguer IaaS, PaaS et SaaS","Identifier les contrôles qui restent côté client"],
   theory:["Dans les clouds publics, le fournisseur gère la sécurité de l'infrastructure sous-jacente. Le client reste responsable de sa configuration, de ses identités, de ses données et des contrôles applicables à son usage.","La répartition change selon le service : une machine virtuelle laisse davantage de gestion système au client qu'un service managé. Managé ne signifie ni sécurisé par défaut ni exempt de surveillance.","Pour un stockage objet exposé, le client doit vérifier politiques d'accès, identité, chiffrement et journalisation. L'hébergement chez un fournisseur ne prouve pas que les autorisations sont correctes."],
   command:"# Exercice sur papier : classe les responsabilités\n# VM : patch du système invité → client\n# Matériel du datacenter → fournisseur",
   challenge:"Pour une API hébergée sur une VM, classe correctifs OS, IAM, matériel physique, contenu des logs et clés applicatives.",
   pitfalls:["Ne pas assimiler conformité du fournisseur et conformité de ton application","Les contrats et offres exactes peuvent modifier certaines responsabilités."],
   source:["AWS · Shared Responsibility Model", "https://aws.amazon.com/compliance/shared-responsibility-model/"]
 },
 "cloud-iam": {
   label:"Cloud · IAM et moindre privilège", objectives:["Distinguer principal, action, ressource et condition","Éviter les autorisations globales","Connaître les rôles temporaires"],
   theory:["Une décision IAM croise une identité, une action sur une ressource et des conditions. Le principe de moindre privilège consiste à limiter chaque permission à l'usage nécessaire, puis à la vérifier régulièrement.","Une permission s3:GetObject sur un préfixe précis n'est pas équivalente à s3:* sur tous les compartiments. Une politique n'est pas évaluée isolément : contrôles organisationnels et refus explicites comptent aussi.","Pour les charges de travail, privilégier des identités et credentials temporaires gérés plutôt que des secrets d'accès permanents dans les fichiers du dépôt."],
   command:"{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\"Effect\": \"Allow\", \"Action\": [\"s3:GetObject\"], \"Resource\": [\"arn:aws:s3:::rc-training/*\"]}]\n}",
   challenge:"Explique pourquoi cette politique ne permet pas de lister les objets ni d'écrire. Quelle permission supplémentaire serait nécessaire, et comment l'encadrer ?",
   pitfalls:["Ne jamais mettre une vraie clé AWS dans un exercice","Une politique illustrative ne remplace pas IAM Access Analyzer."],
   source:["AWS IAM · Security best practices", "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html"]
 },
 "vpc": {
   label:"Cloud · VPC, subnets et security groups", objectives:["Séparer subnet public et privé","Distinguer route et filtrage","Appliquer un inbound minimal"],
   theory:["Le VPC représente un réseau logique isolé. Un subnet définit un segment d'adressage ; la table de routage détermine où vont les paquets. Un subnet dit « public » exige une route adaptée vers une passerelle Internet, mais cela ne rend pas chaque ressource automatiquement joignable.","Les security groups contrôlent les flux autorisés en entrée et en sortie. Les règles AWS SG autorisent ou n'autorisent pas ; ce ne sont pas des règles explicites de refus. Les network ACL constituent une autre couche de filtrage.","Un serveur web peut accepter TCP/443 depuis Internet tandis que la base de données n'autorise que le trafic provenant de l'application. Aucun accès d'administration large n'est nécessaire pour ce schéma."],
   command:"# Dessine : Internet → HTTPS:443 → application → DB:5432\n# Recherche une règle 0.0.0.0/0 sur le port d'administration",
   challenge:"Pourquoi une VM dans un subnet public avec une IP publique et un SG sans port 443 ouvert n'est-elle pas accessible en HTTPS ?",
   pitfalls:["Confondre route, adresse IP publique et permission SG","Ne pas copier 0.0.0.0/0 pour SSH/RDP dans une configuration réelle."],
   source:["AWS VPC · Security group rules", "https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html"]
 },
 "method": {
   label:"Pentest · cadrage et autorisation", objectives:["Définir les actifs autorisés","Fixer une fenêtre et des règles d'arrêt","Prévoir les preuves et la restitution"],
   theory:["Un test d'intrusion commence par une autorisation écrite et un périmètre précis. La même commande peut être légitime dans un laboratoire et inacceptable sur une cible sans autorisation.","Un plan décrit les objectifs, les hôtes, les environnements, les horaires, les actions exclues, les contacts d'urgence et le stockage sécurisé des résultats.","Les découvertes doivent être reproductibles et proportionnées ; ne pas extraire des données personnelles ni provoquer de déni de service pour illustrer un défaut."],
   command:"# Sur un laboratoire possédé uniquement :\n# 1. Définis les actifs inclus\n# 2. Note les actions interdites\n# 3. Consigne les preuves sans secrets",
   challenge:"Rédige un scope de trois phrases pour un laboratoire web fictif : cible, autorisations, interdictions et contact.",
   pitfalls:["« Visible sur Internet » ne signifie pas « autorisé à tester »","Ne pas publier d'informations sensibles dans un rapport d'exercice."],
   source:["OWASP Web Security Testing Guide", "https://owasp.org/www-project-web-security-testing-guide/"]
 },
 "recon": {
   label:"Pentest · reconnaissance défensive", objectives:["Inventorier les surfaces exposées","Distinguer observation et exploitation","Évaluer la fiabilité d'une découverte"],
   theory:["La reconnaissance recense les hôtes, services et versions dans le périmètre autorisé. Une bannière est un indice, pas une preuve définitive de la version installée ou d'une vulnérabilité.","Commencer par les journaux, l'inventaire et les réponses HTTP d'un laboratoire contrôlé. Chaque résultat doit préciser source, date, portée et incertitude.","Après la découverte, classer selon exposition, impact et possibilité de reproduction avant de proposer une correction. Un résultat automatisé reste une hypothèse à valider."],
   command:"# Hôte LOCAL d'entraînement uniquement\ncurl -I http://127.0.0.1:8000\nss -lnt\n# Pas de scan externe sans autorisation",
   challenge:"Une bannière mentionne un ancien serveur. Quelles vérifications permettent de distinguer un faux positif d'un composant réellement vulnérable ?",
   pitfalls:["Ne pas confondre numéro de version et preuve de vulnérabilité","Ne pas élargir le scope à des sous-domaines sans accord explicite."],
   source:["OWASP WSTG · Information gathering", "https://wstg.owasp.org/stable/4-Web_Application_Security_Testing/01-Information_Gathering/"]
 },
 "web": {
   label:"Pentest · sécurité web et contrôle d'accès", objectives:["Séparer authentification et autorisation","Reconnaître un test IDOR/BOLA","Rédiger un constat et une remédiation"],
   theory:["L'authentification prouve l'identité ; l'autorisation détermine si une identité peut agir sur un objet précis. Une URL d'objet prévisible n'est pas forcément une faille : la faille apparaît lorsque le serveur accepte une action interdite.","Dans un environnement de démonstration autorisé, deux utilisateurs de test avec des ressources distinctes permettent de vérifier la politique d'accès. Le verdict exige une réponse observée, pas une supposition.","Une bonne restitution décrit précondition, étape de reproduction contrôlée, résultat attendu et observé, impact et correction. L'autorisation doit être vérifiée côté serveur à chaque action sensible."],
   command:"# Laboratoire de démonstration seulement\n# Compte A et compte B possèdent des objets distincts.\n# Compare le résultat d'accès avec les droits attendus.",
   challenge:"Explique pourquoi masquer le bouton « Supprimer » dans le navigateur ne suffit pas à sécuriser l'API.",
   pitfalls:["Ne pas tester des comptes d'autres personnes","Un code 403 isolé sans contexte n'explique pas toute la politique."],
   source:["OWASP WSTG · Authorization testing", "https://wstg.owasp.org/stable/4-Web_Application_Security_Testing/05-Authorization_Testing/"]
 }
};
