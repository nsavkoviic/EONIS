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
interface ChatMessage { role: 'user' | 'assistant'; content: string; products?: RecommendedProduct[]; timestamp: Date; }
interface RecommendedProduct { productId: string; quantity: number; reason: string; product?: Product; }
interface PetInfo { name: string; species: string; breed: string; weightKg: number | null; ageYears: number | null; sex: string; problem: string; }

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="ai-page">
      <div class="ai-header">
        <div class="ai-header-icon">🤖</div>
        <div>
          <h1 class="ai-title">Pet AI Assistant</h1>
          <p class="ai-subtitle">Tell me about your pet and I'll recommend the perfect products from our store</p>
        </div>
      </div>

      <!-- PHASE 1: Pet Info Form -->
      <div class="pet-form-card" *ngIf="phase === 1">
        <h2 class="form-title">🐾 Tell me about your pet</h2>
        <p class="form-hint">The more details you provide, the better my recommendations will be!</p>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Pet Name</mat-label><input matInput [(ngModel)]="petInfo.name" placeholder="e.g. Max"><mat-icon matSuffix>pets</mat-icon></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Species</mat-label>
            <mat-select [(ngModel)]="petInfo.species">
              <mat-option value="dog">🐕 Dog</mat-option><mat-option value="cat">🐈 Cat</mat-option>
              <mat-option value="bird">🐦 Bird</mat-option><mat-option value="fish">🐠 Fish</mat-option>
              <mat-option value="reptile">🦎 Reptile</mat-option><mat-option value="small animal">🐹 Small Animal</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Breed (optional)</mat-label><input matInput [(ngModel)]="petInfo.breed" placeholder="e.g. Golden Retriever"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Sex</mat-label>
            <mat-select [(ngModel)]="petInfo.sex"><mat-option value="male">Male</mat-option><mat-option value="female">Female</mat-option><mat-option value="unknown">Unknown</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Weight (kg)</mat-label><input matInput type="number" [(ngModel)]="petInfo.weightKg" placeholder="e.g. 25" min="0.1"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Age (years)</mat-label><input matInput type="number" [(ngModel)]="petInfo.ageYears" placeholder="e.g. 3" min="0"></mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width"><mat-label>What do you need help with?</mat-label>
          <textarea matInput [(ngModel)]="petInfo.problem" rows="3" placeholder="e.g. My dog needs food for 3 months, also looking for a toy..."></textarea>
        </mat-form-field>
        <div class="quick-prompts"><span class="quick-label">Quick topics:</span>
          <button class="quick-chip" *ngFor="let q of quickPrompts" (click)="petInfo.problem = q">{{ q }}</button>
        </div>
        <button class="start-btn" (click)="startChat()" [disabled]="!petInfo.species || !petInfo.problem.trim() || isLoading">
          <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
          <mat-icon *ngIf="!isLoading">auto_awesome</mat-icon>
          {{ isLoading ? 'Analyzing...' : 'Get AI Recommendations' }}
        </button>
      </div>

      <!-- PHASE 2: Chat + Recommendations -->
      <div class="chat-layout" *ngIf="phase === 2">
        <div class="chat-panel">
          <div class="chat-pet-info">
            <span class="pet-badge">{{ getSpeciesEmoji(petInfo.species) }} {{ petInfo.name || 'Your pet' }}
              <span *ngIf="petInfo.weightKg">· {{ petInfo.weightKg }}kg</span>
              <span *ngIf="petInfo.ageYears">· {{ petInfo.ageYears }}yr</span>
            </span>
            <button class="reset-btn" (click)="reset()"><mat-icon>refresh</mat-icon> New Session</button>
          </div>
          <div class="messages-wrap">
            <div class="message" *ngFor="let msg of messages" [class.user-msg]="msg.role==='user'" [class.ai-msg]="msg.role==='assistant'">
              <div class="msg-avatar" *ngIf="msg.role==='assistant'">🤖</div>
              <div class="msg-bubble">
                <div class="msg-text" [innerHTML]="formatMessage(msg.content)"></div>
                <div class="msg-time">{{ msg.timestamp | date:'HH:mm' }}</div>
              </div>
              <div class="msg-avatar user-icon" *ngIf="msg.role==='user'"><mat-icon>person</mat-icon></div>
            </div>
            <div class="message ai-msg" *ngIf="isLoading">
              <div class="msg-avatar">🤖</div>
              <div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
            </div>
          </div>
          <div class="chat-input-row">
            <input class="chat-input" [(ngModel)]="userInput" placeholder="Ask a follow-up question..." (keydown.enter)="sendMessage()" [disabled]="isLoading">
            <button class="send-btn" (click)="sendMessage()" [disabled]="!userInput.trim() || isLoading"><mat-icon>send</mat-icon></button>
          </div>
        </div>

        <div class="products-panel">
          <h3 class="panel-title"><mat-icon>recommend</mat-icon> Recommended Products</h3>
          <div class="spinner-wrap" *ngIf="isLoading && recommendedProducts.length===0"><mat-spinner diameter="32"></mat-spinner><p>Analyzing your pet's needs...</p></div>
          <div class="no-reco" *ngIf="!isLoading && recommendedProducts.length===0"><mat-icon>pets</mat-icon><p>Products will appear here after the AI analyzes your pet's needs</p></div>
          <div class="reco-list">
            <div class="reco-product-card" *ngFor="let reco of recommendedProducts">
              <img [src]="reco.product?.imageUrl || 'https://placehold.co/80x80?text=?'" [alt]="reco.product?.name" class="reco-img" (click)="goToProduct(reco.productId)">
              <div class="reco-info">
                <div class="reco-name" (click)="goToProduct(reco.productId)">{{ reco.product?.name }}</div>
                <div class="reco-reason">{{ reco.reason }}</div>
                <div class="reco-footer">
                  <span class="reco-price">{{ reco.product?.price | currency:'EUR' }}</span>
                  <div class="reco-qty-row">
                    <span class="qty-label">Qty:</span>
                    <button class="qty-btn" (click)="changeQty(reco,-1)">−</button>
                    <span class="qty-val">{{ reco.quantity }}</span>
                    <button class="qty-btn" (click)="changeQty(reco,1)">+</button>
                    <button class="add-cart-btn" (click)="addToCart(reco)" [disabled]="!reco.product?.isAvailable || !isLoggedIn" [matTooltip]="!isLoggedIn ? 'Login to add to cart' : ''"><mat-icon>add_shopping_cart</mat-icon></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button class="add-all-btn" *ngIf="recommendedProducts.length > 1 && isLoggedIn" (click)="addAllToCart()"><mat-icon>shopping_cart</mat-icon> Add All to Cart</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-page { max-width: 1200px; margin: 0 auto; }
    .ai-header { display:flex; align-items:center; gap:20px; margin-bottom:32px; padding:28px 32px; background:linear-gradient(135deg,#fff8f0,#fff3e0); border-radius:20px; border:1px solid #f0e6d3; }
    .ai-header-icon { font-size:3.5rem; line-height:1; }
    .ai-title { margin:0 0 6px; font-size:2rem; font-weight:800; }
    .ai-subtitle { margin:0; color:#6b7280; font-size:1rem; }
    .pet-form-card { background:white; border-radius:20px; border:1px solid #f0e6d3; padding:32px; max-width:760px; margin:0 auto; }
    .form-title { margin:0 0 8px; font-size:1.4rem; font-weight:800; }
    .form-hint { color:#6b7280; margin:0 0 24px; font-size:.95rem; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    .form-grid mat-form-field { width:100%; }
    .full-width { width:100%; }
    .quick-prompts { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:24px; }
    .quick-label { font-size:.8rem; color:#9ca3af; font-weight:600; }
    .quick-chip { padding:4px 12px; border-radius:16px; border:1.5px solid #f0e6d3; background:#fff8f0; color:#92400e; font-size:.8rem; cursor:pointer; transition:all .15s; font-family:inherit; }
    .quick-chip:hover { background:#fff3e0; border-color:#f57c00; }
    .start-btn { width:100%; height:56px; border-radius:14px; border:none; background:linear-gradient(135deg,#f57c00,#e65100); color:white; font-size:1.05rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; font-family:inherit; box-shadow:0 4px 20px rgba(245,124,0,.35); transition:all .2s; }
    .start-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(245,124,0,.45); }
    .start-btn:disabled { opacity:.65; cursor:not-allowed; transform:none; }
    .chat-layout { display:grid; grid-template-columns:1fr 380px; gap:24px; align-items:start; }
    .chat-panel { background:white; border-radius:20px; border:1px solid #f0e6d3; overflow:hidden; display:flex; flex-direction:column; height:680px; }
    .chat-pet-info { display:flex; justify-content:space-between; align-items:center; padding:14px 20px; background:#fff8f0; border-bottom:1px solid #f0e6d3; }
    .pet-badge { background:#fff3e0; border:1px solid #fed7aa; padding:4px 14px; border-radius:20px; font-size:.85rem; font-weight:600; color:#92400e; }
    .reset-btn { display:flex; align-items:center; gap:4px; background:none; border:1px solid #e5e7eb; border-radius:8px; padding:4px 10px; cursor:pointer; font-size:.8rem; color:#6b7280; transition:all .15s; font-family:inherit; }
    .reset-btn:hover { border-color:#f57c00; color:#f57c00; }
    .reset-btn mat-icon { font-size:14px; width:14px; height:14px; }
    .messages-wrap { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:16px; }
    .message { display:flex; gap:10px; align-items:flex-end; }
    .user-msg { flex-direction:row-reverse; }
    .msg-avatar { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; background:#f3f4f6; }
    .user-icon { background:linear-gradient(135deg,#f57c00,#e65100); color:white; }
    .user-icon mat-icon { font-size:18px; }
    .msg-bubble { max-width:75%; }
    .user-msg .msg-bubble { display:flex; flex-direction:column; align-items:flex-end; }
    .msg-text { padding:10px 14px; border-radius:16px; font-size:.9rem; line-height:1.6; background:#f3f4f6; color:#1a1a1a; }
    .user-msg .msg-text { background:linear-gradient(135deg,#f57c00,#e65100); color:white; border-radius:16px 16px 4px 16px; }
    .ai-msg .msg-text { border-radius:16px 16px 16px 4px; }
    .msg-time { font-size:.7rem; color:#9ca3af; margin-top:4px; padding:0 4px; }
    .typing-indicator { display:flex; gap:4px; padding:12px 16px; background:#f3f4f6; border-radius:16px 16px 16px 4px; }
    .typing-indicator span { width:8px; height:8px; border-radius:50%; background:#9ca3af; animation:bounce 1.2s infinite; }
    .typing-indicator span:nth-child(2) { animation-delay:.2s; }
    .typing-indicator span:nth-child(3) { animation-delay:.4s; }
    @keyframes bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-8px); } }
    .chat-input-row { display:flex; gap:8px; padding:16px; border-top:1px solid #f0e6d3; background:white; }
    .chat-input { flex:1; border:1.5px solid #e5e7eb; border-radius:12px; padding:10px 16px; font-size:.95rem; outline:none; font-family:inherit; transition:border-color .2s; }
    .chat-input:focus { border-color:#f57c00; }
    .send-btn { width:44px; height:44px; border-radius:12px; border:none; background:linear-gradient(135deg,#f57c00,#e65100); color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
    .send-btn:hover:not(:disabled) { transform:scale(1.05); }
    .send-btn:disabled { opacity:.5; cursor:not-allowed; }
    .products-panel { background:white; border-radius:20px; border:1px solid #f0e6d3; padding:20px; max-height:680px; overflow-y:auto; }
    .panel-title { display:flex; align-items:center; gap:8px; font-size:1rem; font-weight:700; margin:0 0 16px; color:#f57c00; }
    .spinner-wrap { text-align:center; padding:32px; color:#9ca3af; }
    .spinner-wrap p { margin-top:12px; font-size:.85rem; }
    .no-reco { text-align:center; padding:32px; color:#9ca3af; }
    .no-reco mat-icon { font-size:40px; width:40px; height:40px; opacity:.4; }
    .no-reco p { font-size:.85rem; margin-top:8px; }
    .reco-product-card { display:flex; gap:12px; padding:14px; border:1px solid #f0e6d3; border-radius:14px; margin-bottom:12px; transition:all .2s; }
    .reco-product-card:hover { border-color:#fed7aa; background:#fffbf5; }
    .reco-img { width:72px; height:72px; border-radius:10px; object-fit:cover; cursor:pointer; flex-shrink:0; transition:transform .2s; }
    .reco-img:hover { transform:scale(1.05); }
    .reco-info { flex:1; min-width:0; }
    .reco-name { font-weight:700; font-size:.88rem; color:#1a1a1a; margin-bottom:4px; cursor:pointer; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .reco-name:hover { color:#f57c00; }
    .reco-reason { font-size:.75rem; color:#6b7280; line-height:1.4; margin-bottom:8px; font-style:italic; }
    .reco-footer { display:flex; flex-direction:column; gap:6px; }
    .reco-price { font-size:1rem; font-weight:800; color:#f57c00; }
    .reco-qty-row { display:flex; align-items:center; gap:6px; }
    .qty-label { font-size:.75rem; color:#9ca3af; }
    .qty-btn { width:24px; height:24px; border-radius:6px; border:1px solid #e5e7eb; background:white; cursor:pointer; font-size:1rem; font-weight:700; display:flex; align-items:center; justify-content:center; color:#374151; transition:all .15s; }
    .qty-btn:hover { border-color:#f57c00; color:#f57c00; }
    .qty-val { font-weight:700; font-size:.9rem; min-width:20px; text-align:center; }
    .add-cart-btn { width:32px; height:32px; border-radius:8px; border:none; background:linear-gradient(135deg,#f57c00,#e65100); color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; margin-left:4px; }
    .add-cart-btn mat-icon { font-size:16px; width:16px; height:16px; }
    .add-cart-btn:hover:not(:disabled) { transform:scale(1.1); }
    .add-cart-btn:disabled { opacity:.5; cursor:not-allowed; }
    .add-all-btn { width:100%; height:44px; border-radius:12px; border:none; background:linear-gradient(135deg,#f57c00,#e65100); color:white; font-size:.9rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; box-shadow:0 4px 16px rgba(245,124,0,.3); transition:all .2s; margin-top:8px; }
    .add-all-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(245,124,0,.4); }
    @media (max-width:900px) { .chat-layout { grid-template-columns:1fr; } .chat-panel { height:500px; } .products-panel { max-height:500px; } .form-grid { grid-template-columns:1fr; } }
  `]
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
  quickPrompts = ['Need food for 3 months', 'Looking for toys to keep busy', 'Dental health treats', 'Need a harness for walks', 'My pet is overweight', 'Best food for senior pet'];

  constructor(private productSvc: ProductService, private cartSvc: CartService, private notify: NotificationService, private authSvc: AuthService) { }

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
    this.cartSvc.addItem({ productId: reco.productId, quantity: reco.quantity }).subscribe(() => this.notify.showSuccess(`"${reco.product!.name}" (x${reco.quantity}) added to cart!`));
  }
  addAllToCart(): void {
    let count = 0;
    this.recommendedProducts.forEach(reco => {
      if (reco.product?.isAvailable) {
        this.cartSvc.addItem({ productId: reco.productId, quantity: reco.quantity }).subscribe(() => {
          count++;
          if (count === this.recommendedProducts.filter(r => r.product?.isAvailable).length) this.notify.showSuccess(`${count} products added to cart!`);
        });
      }
    });
  }
  goToProduct(productId: string): void { window.open(`/products/${productId}`, '_blank'); }
  reset(): void { this.phase = 1; this.messages = []; this.recommendedProducts = []; this.petInfo = { name: '', species: '', breed: '', weightKg: null, ageYears: null, sex: '', problem: '' }; this.userInput = ''; }
}
