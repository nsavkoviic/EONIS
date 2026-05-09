import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../core/models/product.models';
import { environment } from '../../../environments/environment';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
interface ChatMessage { role: 'user' | 'assistant'; content: string; products?: RecommendedProduct[]; timestamp: Date; }
interface RecommendedProduct { productId: string; quantity: number; reason: string; product?: Product; }
interface PetInfo { name: string; species: string; breed: string; weightKg: number | null; ageYears: number | null; sex: string; problem: string; }

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatChipsModule, MatTooltipModule, TranslateModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export default class AiAssistantComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  phase: 1 | 2 = 1;
  isLoading = false;
  isLoggedIn = false;
  petInfo: PetInfo = { name: '', species: '', breed: '', weightKg: null, ageYears: null, sex: '', problem: '' };
  messages: ChatMessage[] = [];
  userInput = '';
  recommendedProducts: RecommendedProduct[] = [];
  allProducts: Product[] = [];
  quickPrompts = [
    { value: 'Need food for 3 months', label: 'AI.QUICK_1' },
    { value: 'Looking for toys to keep busy', label: 'AI.QUICK_2' },
    { value: 'Dental health treats', label: 'AI.QUICK_3' },
    { value: 'Need a harness for walks', label: 'AI.QUICK_4' },
    { value: 'My pet is overweight', label: 'AI.QUICK_5' },
    { value: 'Best food for senior pet', label: 'AI.QUICK_6' }
  ];

  constructor(private productSvc: ProductService, private cartSvc: CartService, private notify: NotificationService, private authSvc: AuthService, private translate: TranslateService) { }

  ngOnInit(): void {
    this.authSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(v => this.isLoggedIn = v);
    this.productSvc.getProducts({ page: 1, pageSize: 100 }).pipe(takeUntil(this.destroy$)).subscribe(r => this.allProducts = r.items);
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  getSpeciesEmoji(species: string): string {
    const map: Record<string, string> = { dog: '🐕', cat: '🐈', bird: '🐦', fish: '🐠', reptile: '🦎', 'small animal': '🐹' };
    return map[species] ?? '🐾';
  }

  async startChat(): Promise<void> {
    this.phase = 2; this.isLoading = true;
    const userMsg = this.buildInitialPrompt();
    this.messages.push({ role: 'user', content: userMsg, timestamp: new Date() });
    await this.callClaudeAPI(this.buildMessagesForAPI());
  }

  async sendMessage(): Promise<void> {
    if (!this.userInput.trim() || this.isLoading) return;
    const text = this.userInput.trim(); this.userInput = '';
    this.messages.push({ role: 'user', content: text, timestamp: new Date() });
    this.isLoading = true;
    await this.callClaudeAPI(this.buildMessagesForAPI());
  }

  private buildInitialPrompt(): string {
    const p = this.petInfo;
    return `My pet: ${p.name || 'unnamed'} the ${p.species}${p.breed ? ` (${p.breed})` : ''}, ${p.sex || 'unknown sex'}, ${p.ageYears ?? '?'} years old, ${p.weightKg ?? '?'} kg.\n\nI need help with: ${p.problem}`;
  }

  private buildMessagesForAPI(): { role: string; content: string }[] {
    return this.messages.map(m => ({ role: m.role, content: m.content }));
  }

  private buildSystemPrompt(): string {
    const productList = this.allProducts.map(p => `ID:${p.id} | "${p.name}" | €${p.price} | Category:${p.category} | ${p.isAvailable ? 'In Stock' : 'Out of Stock'}`).join('\n');
    return `You are a friendly and knowledgeable pet care assistant for PetShop, an online pet store.
You help pet owners find the right products for their pets based on species, breed, weight, age, and needs.

AVAILABLE PRODUCTS IN OUR STORE:
${productList}

YOUR TASK:
1. Give warm, helpful advice about the pet's needs
2. Recommend specific products from our store (use their exact IDs)
3. Calculate appropriate quantities (e.g., food for 3 months based on weight)
4. Explain WHY each product is suitable

RESPONSE FORMAT:
Respond in a conversational, friendly tone. After your advice, if you have product recommendations, end your response with a JSON block like this:

<recommendations>
[{"productId":"exact-product-id-here","quantity":2,"reason":"Short reason why this is perfect for this pet"}]
</recommendations>

Only recommend products that are In Stock and genuinely relevant.
If no products match, say so and give general advice.
Keep responses concise — 2-4 paragraphs max.`;
  }

  private async callClaudeAPI(messages: { role: string; content: string }[]): Promise<void> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': environment.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: this.buildSystemPrompt(),
          messages: messages,
        })
      });
      const data = await response.json();

      if (data.error) {
        this.messages.push({
          role: 'assistant',
          content: 'Error: ' + (data.error.message || JSON.stringify(data.error)),
          timestamp: new Date()
        });
        this.isLoading = false;
        return;
      }

      const fullText: string = data.content
        ?.filter((b: any) => b.type === 'text')
        ?.map((b: any) => b.text)
        ?.join('') ?? 'Sorry, I could not generate a response.';
      const recoMatch = fullText.match(/<recommendations>([\s\S]*?)<\/recommendations>/);
      let cleanText = fullText.replace(/<recommendations>[\s\S]*?<\/recommendations>/, '').trim();
      this.messages.push({ role: 'assistant', content: cleanText, timestamp: new Date() });
      if (recoMatch) {
        try {
          const recos: RecommendedProduct[] = JSON.parse(recoMatch[1].trim());
          const enriched = recos.map(r => ({ ...r, product: this.allProducts.find(p => p.id === r.productId) })).filter(r => r.product !== undefined);
          enriched.forEach(nr => {
            const idx = this.recommendedProducts.findIndex(r => r.productId === nr.productId);
            if (idx >= 0) this.recommendedProducts[idx] = nr; else this.recommendedProducts.push(nr);
          });
        } catch (e) { /* ignore parse errors */ }
      }
      setTimeout(() => { const w = document.querySelector('.messages-wrap'); if (w) w.scrollTop = w.scrollHeight; }, 100);
    } catch (error) {
      this.messages.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() });
    } finally { this.isLoading = false; }
  }

  formatMessage(content: string): string {
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }
  changeQty(reco: RecommendedProduct, delta: number): void { reco.quantity = Math.max(1, reco.quantity + delta); }
  addToCart(reco: RecommendedProduct): void {
    if (!reco.product) return;
    this.cartSvc.addItem({ productId: reco.productId, quantity: reco.quantity }).subscribe(() => this.notify.showSuccess(this.translate.instant('TOAST.ADDED_TO_CART')));
  }
  addAllToCart(): void {
    let count = 0;
    this.recommendedProducts.forEach(reco => {
      if (reco.product?.isAvailable) {
        this.cartSvc.addItem({ productId: reco.productId, quantity: reco.quantity }).subscribe(() => {
          count++;
          if (count === this.recommendedProducts.filter(r => r.product?.isAvailable).length) this.notify.showSuccess(this.translate.instant('TOAST.ADDED_TO_CART'));
        });
      }
    });
  }
  goToProduct(productId: string): void { window.open(`/products/${productId}`, '_blank'); }
  reset(): void { this.phase = 1; this.messages = []; this.recommendedProducts = []; this.petInfo = { name: '', species: '', breed: '', weightKg: null, ageYears: null, sex: '', problem: '' }; this.userInput = ''; }
}
