#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════
# TaskFlow — Deploy Vercel + Release APK + Auto-Update
# ═══════════════════════════════════════════════════════

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

VERCEL_DOMAIN="taskflow-woad-six.vercel.app"
APK_OUTPUT="android/app/build/outputs/apk/release/app-release.apk"
APK_PUBLIC="public/releases/app-release.apk"
VERSION_FILE="public/version.json"

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
print_ok() { echo -e "${GREEN}✓ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_err() { echo -e "${RED}✗ $1${NC}"; }

# ─── Leggi versione corrente ───
CURRENT_CODE=$(node -e "const v=require('./$VERSION_FILE'); console.log(v.versionCode)")
CURRENT_NAME=$(node -e "const v=require('./$VERSION_FILE'); console.log(v.versionName)")

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║        TaskFlow Deploy Workflow           ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"
echo "Versione corrente: v${CURRENT_NAME} (code: ${CURRENT_CODE})"
echo ""

# ─── Menu ───
echo "Cosa vuoi fare?"
echo "  1) Deploy completo (Web + APK + Vercel)"
echo "  2) Solo deploy web su Vercel"
echo "  3) Solo build APK + upload su Vercel"
echo "  4) Solo bump versione"
echo ""
read -p "Scegli [1-4]: " CHOICE

# ─── Bump versione ───
bump_version() {
  print_step "BUMP VERSIONE"
  echo "Versione corrente: v${CURRENT_NAME} (code: ${CURRENT_CODE})"
  echo ""
  echo "Tipo di bump:"
  echo "  1) Patch (${CURRENT_NAME} → $(echo $CURRENT_NAME | awk -F. '{print $1"."$2"."$3+1}'))"
  echo "  2) Minor (${CURRENT_NAME} → $(echo $CURRENT_NAME | awk -F. '{print $1"."$2+1".0"}'))"
  echo "  3) Major (${CURRENT_NAME} → $(echo $CURRENT_NAME | awk -F. '{print $1+1".0.0"}'))"
  echo "  4) Custom"
  echo ""
  read -p "Scegli [1-4]: " BUMP_TYPE

  case $BUMP_TYPE in
    1) NEW_NAME=$(echo $CURRENT_NAME | awk -F. '{print $1"."$2"."$3+1}') ;;
    2) NEW_NAME=$(echo $CURRENT_NAME | awk -F. '{print $1"."$2+1".0"}') ;;
    3) NEW_NAME=$(echo $CURRENT_NAME | awk -F. '{print $1+1".0.0"}') ;;
    4) read -p "Nuova versione (es: 2.1.0): " NEW_NAME ;;
    *) print_err "Scelta non valida"; exit 1 ;;
  esac

  NEW_CODE=$((CURRENT_CODE + 1))

  read -p "Note di rilascio: " RELEASE_NOTES
  read -p "Forzare aggiornamento? (s/N): " FORCE_UPDATE
  FORCE_FLAG="false"
  [[ "$FORCE_UPDATE" =~ ^[sS]$ ]] && FORCE_FLAG="true"

  # Aggiorna version.json
  cat > "$VERSION_FILE" << EOF
{
  "versionCode": ${NEW_CODE},
  "versionName": "${NEW_NAME}",
  "apkUrl": "https://${VERCEL_DOMAIN}/releases/app-release.apk",
  "releaseNotes": "${RELEASE_NOTES}",
  "forceUpdate": ${FORCE_FLAG}
}
EOF

  # Aggiorna build.gradle
  sed -i '' "s/versionCode [0-9]*/versionCode ${NEW_CODE}/" android/app/build.gradle
  sed -i '' "s/versionName \"[^\"]*\"/versionName \"${NEW_NAME}\"/" android/app/build.gradle

  # Aggiorna useAppUpdate.js (versione hardcoded nell'app)
  HOOK_FILE="src/hooks/useAppUpdate.js"
  sed -i '' "s/const APP_VERSION_CODE = [0-9]*/const APP_VERSION_CODE = ${NEW_CODE}/" "$HOOK_FILE"
  sed -i '' "s/const APP_VERSION_NAME = '[^']*'/const APP_VERSION_NAME = '${NEW_NAME}'/" "$HOOK_FILE"
  print_ok "useAppUpdate.js aggiornato"

  CURRENT_CODE=$NEW_CODE
  CURRENT_NAME=$NEW_NAME

  print_ok "Versione aggiornata a v${NEW_NAME} (code: ${NEW_CODE})"
}

# ─── Build Web ───
build_web() {
  print_step "BUILD WEB (Vite)"
  npm run build
  print_ok "Build web completata → dist/"
}

# ─── Build APK ───
build_apk() {
  print_step "BUILD APK (Android)"
  
  # Sync Capacitor
  echo "Sincronizzazione Capacitor..."
  npx cap sync android
  print_ok "Capacitor sincronizzato"

  # Build APK (firmato)
  echo "Compilazione APK firmato..."
  cd android
  JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home" \
  ./gradlew assembleRelease --no-daemon -q \
    -Pandroid.injected.signing.store.file="$PWD/taskflow-release.keystore" \
    -Pandroid.injected.signing.store.password="TaskFlow2026!" \
    -Pandroid.injected.signing.key.alias="taskflow" \
    -Pandroid.injected.signing.key.password="TaskFlow2026!"
  cd ..

  if [ ! -f "$APK_OUTPUT" ]; then
    # Prova anche il nome senza -unsigned
    APK_OUTPUT="android/app/build/outputs/apk/release/app-release.apk"
    if [ ! -f "$APK_OUTPUT" ]; then
      print_err "APK non trovata! Controlla il build."
      exit 1
    fi
  fi

  # Copia APK nella cartella pubblica
  mkdir -p public/releases
  cp "$APK_OUTPUT" "$APK_PUBLIC"

  APK_SIZE=$(du -h "$APK_PUBLIC" | cut -f1)
  print_ok "APK generata: ${APK_SIZE}"
}

# ─── Deploy Vercel ───
deploy_vercel() {
  print_step "DEPLOY SU VERCEL"

  # Build e deploy in produzione
  DEPLOY_URL=$(vercel --prod --yes 2>&1 | tail -1)

  # Estrai dominio
  if [[ "$DEPLOY_URL" == https://* ]]; then
    DEPLOYED_DOMAIN=$(echo "$DEPLOY_URL" | sed 's|https://||')
    print_ok "Deploy completato: ${DEPLOY_URL}"
  else
    print_warn "Output deploy: ${DEPLOY_URL}"
    DEPLOYED_DOMAIN=$(vercel ls --scope agservizi 2>/dev/null | grep taskflow | head -1 | awk '{print $2}' || echo "")
  fi

  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════${NC}"
  echo -e "${GREEN}  Deploy completato!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════${NC}"
  echo ""
  echo -e "  🌐 Web App:  ${BLUE}${DEPLOY_URL}${NC}"
  echo -e "  📦 APK URL:  ${BLUE}${DEPLOY_URL}/releases/app-release.apk${NC}"
  echo -e "  📋 Version:  ${BLUE}${DEPLOY_URL}/version.json${NC}"
  echo ""
}

# ─── Rileva dominio Vercel ───
detect_vercel_domain() {
  # Prova a leggere dal progetto Vercel
  if [ -f ".vercel/project.json" ]; then
    PROJ_NAME=$(node -e "const p=require('./.vercel/project.json'); console.log(p.projectId || '')" 2>/dev/null || echo "")
  fi

  # Chiedi o usa default
  if [ -z "$VERCEL_DOMAIN" ]; then
    echo ""
    read -p "Dominio Vercel (es: taskflow-xyz.vercel.app, invio per auto): " CUSTOM_DOMAIN
    if [ -n "$CUSTOM_DOMAIN" ]; then
      VERCEL_DOMAIN="$CUSTOM_DOMAIN"
    else
      VERCEL_DOMAIN="taskflow.vercel.app"
    fi
  fi
}

# ═══ ESECUZIONE ═══

detect_vercel_domain

case $CHOICE in
  1) # Deploy completo
    bump_version
    build_web
    build_apk
    
    # Rebuild web con version.json aggiornata (include APK)
    print_step "REBUILD FINALE (include APK aggiornata)"
    npm run build
    # Copia releases nella dist
    mkdir -p dist/releases
    cp "$APK_PUBLIC" dist/releases/
    print_ok "APK inclusa nel build"
    
    deploy_vercel
    ;;
  2) # Solo web
    build_web
    deploy_vercel
    ;;
  3) # Solo APK
    bump_version
    build_web
    build_apk

    print_step "REBUILD FINALE (include APK)"
    npm run build
    mkdir -p dist/releases
    cp "$APK_PUBLIC" dist/releases/
    print_ok "APK inclusa nel build"

    deploy_vercel
    ;;
  4) # Solo bump
    detect_vercel_domain
    bump_version
    print_ok "Versione aggiornata. Lancia il deploy quando pronto."
    ;;
  *)
    print_err "Scelta non valida"
    exit 1
    ;;
esac
