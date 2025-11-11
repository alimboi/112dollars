import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  // Sample course pictures and content
  courseImages = [
    {
      src: 'assets/images/course-1.jpg',
      alt: 'Python Programming Course',
      title: 'Python Programming'
    },
    {
      src: 'assets/images/course-2.jpg',
      alt: 'Web Development Course',
      title: 'Web Development'
    },
    {
      src: 'assets/images/course-3.jpg',
      alt: 'Data Science Course',
      title: 'Data Science'
    },
    {
      src: 'assets/images/course-4.jpg',
      alt: 'JavaScript Course',
      title: 'JavaScript Mastery'
    },
  ];

  ngOnInit(): void {
    // Component initialization
  }
}
