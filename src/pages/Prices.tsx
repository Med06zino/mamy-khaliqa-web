import { useDocumentTitle } from "../hooks/useApi";
import { Lightbulb } from 'lucide-react';

export default function Prices() {
  useDocumentTitle("Nos tarifs", "Liste complète des prix de nos gammes Khaliqa Hair et Khaliqa Beauty.");

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Nos tarifs
          </h1>
          <p className="mt-3 text-muted">
            Découvrez nos gammes de produits à des prix accessibles
          </p>
        </div>

        {/* Image des tarifs */}
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <img
            src="/placeholder/tarifs-khaliqa-hair.jfif"
            alt="Liste des prix Khaliqa Hair - Gamme Aloe Vera, Moringa, Fenugrec et Baby"
            className="w-full rounded-xl"
          />
        </div>

        {/* Informations complémentaires */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold text-ink mb-2">
              Besoin de conseils ?
            </h3>
            <p className="text-sm text-muted mb-4">
              Contactez-nous pour trouver la gamme adaptée à vos besoins capillaires.
            </p>
            <a
              href="https://wa.me/221710497804"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-plum px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-plum-dark"
            >
              Discuter sur WhatsApp
            </a>
          </div>

          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold text-ink mb-2">
              Commandez en ligne
            </h3>
            <p className="text-sm text-muted mb-4">
              Parcourez notre boutique et commandez vos produits préférés.
            </p>
            <a
              href="/boutique"
              className="inline-flex items-center gap-2 rounded-full border border-plum px-5 py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-blush"
            >
              Voir la boutique
            </a>
          </div>
        </div>

        {/* Note sur les prix */}
        <div className="mt-8 rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
          <p className="font-semibold text-ink mb-2"> 
            <Lightbulb className="inline-block mr-2" />Note importante</p>
          <p>
            Les prix indiqués sont en FCFA et peuvent varier en fonction des promotions en cours.
            Pour toute question, n'hésitez pas à nous contacter via WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
