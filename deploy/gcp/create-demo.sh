#!/bin/sh
# Ejecutar en Google Cloud Shell desde la raiz del repositorio.
set -eu
: "${GCP_PROJECT_ID:?Define GCP_PROJECT_ID}"
ZONE=us-central1-a
REGION=us-central1
VM=medicom-demo-v2
NETWORK=medicom-demo-v2
SA="medicom-deploy@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

gcloud services enable compute.googleapis.com iap.googleapis.com iam.googleapis.com \
  --project="$GCP_PROJECT_ID"

if ! gcloud compute networks describe "$NETWORK" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute networks create "$NETWORK" --subnet-mode=custom --project="$GCP_PROJECT_ID"
fi
if ! gcloud compute networks subnets describe "$NETWORK" --region="$REGION" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute networks subnets create "$NETWORK" --network="$NETWORK" \
    --region="$REGION" --range=10.44.0.0/24 --project="$GCP_PROJECT_ID"
fi
if ! gcloud compute firewall-rules describe medicom-v2-web --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute firewall-rules create medicom-v2-web --network="$NETWORK" \
    --allow=tcp:80,tcp:443 --source-ranges=0.0.0.0/0 --target-tags=medicom-web \
    --project="$GCP_PROJECT_ID"
fi
if ! gcloud compute firewall-rules describe medicom-v2-iap --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute firewall-rules create medicom-v2-iap --network="$NETWORK" \
    --allow=tcp:22 --source-ranges=35.235.240.0/20 --target-tags=medicom-web \
    --project="$GCP_PROJECT_ID"
fi

if ! gcloud iam service-accounts describe "$SA" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create medicom-deploy --display-name='MEDICOM GitHub deploy' \
    --project="$GCP_PROJECT_ID"
fi
# Permisos de lectura de VM, SSH administrativo mediante OS Login y tunel IAP.
for role in roles/compute.viewer roles/compute.osAdminLogin roles/iap.tunnelResourceAccessor; do
  gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:$SA" --role="$role" --condition=None --quiet >/dev/null
done

if ! gcloud compute instances describe "$VM" --zone="$ZONE" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute instances create "$VM" --project="$GCP_PROJECT_ID" --zone="$ZONE" \
    --machine-type=e2-medium --image-family=ubuntu-2404-lts-amd64 --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB --boot-disk-type=pd-standard --network="$NETWORK" --subnet="$NETWORK" \
    --tags=medicom-web --no-service-account --no-scopes \
    --metadata=enable-oslogin=TRUE \
    --metadata-from-file=startup-script=deploy/gcp/startup.sh
fi
gcloud compute instances describe "$VM" --zone="$ZONE" --project="$GCP_PROJECT_ID" \
  --format='table(name,status,networkInterfaces[0].accessConfigs[0].natIP)'
